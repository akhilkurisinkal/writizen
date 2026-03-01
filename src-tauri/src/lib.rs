use git2::{Repository, Signature, Cred, RemoteCallbacks, PushOptions, StatusOptions};

#[tauri::command]
fn git_init(path: String) -> Result<String, String> {
    match Repository::init(&path) {
        Ok(_) => Ok("Initialized".to_string()),
        Err(e) => Err(e.message().to_string()),
    }
}

#[tauri::command]
fn git_status(path: String) -> Result<bool, String> {
    let repo = Repository::open(&path).map_err(|e| e.message().to_string())?;
    let mut opts = StatusOptions::new();
    opts.include_untracked(true);
    let statuses = repo.statuses(Some(&mut opts)).map_err(|e| e.message().to_string())?;
    Ok(!statuses.is_empty())
}

#[tauri::command]
fn git_commit_and_push(path: String, repo_url: String, pat: String, author_name: String, author_email: String, force: bool) -> Result<String, String> {
    let repo = match Repository::open(&path) {
        Ok(r) => r,
        Err(_) => {
            let mut opts = git2::RepositoryInitOptions::new();
            opts.initial_head("main");
            Repository::init_opts(&path, &opts).map_err(|e| format!("Failed to init repo at {}: {}", path, e.message()))?
        }
    };

    // Stage changes (use "." to ensure hidden files like .github are staged)
    let mut index = repo.index().map_err(|e| e.message().to_string())?;
    index.add_all(["."].iter(), git2::IndexAddOption::DEFAULT, None).map_err(|e| e.message().to_string())?;
    index.write().map_err(|e| e.message().to_string())?;
    
    // Commit
    let oid = index.write_tree().map_err(|e| e.message().to_string())?;
    let tree = repo.find_tree(oid).map_err(|e| e.message().to_string())?;
    
    let safe_name = if author_name.trim().is_empty() { "Writizen User" } else { &author_name };
    let safe_email = if author_email.trim().is_empty() { "user@writizen.local" } else { &author_email };
    
    let signature = Signature::now(safe_name, safe_email).map_err(|e| e.message().to_string())?;
    
    let parent_commit = match repo.head() {
        Ok(head) => Some(head.peel_to_commit().map_err(|e| e.message().to_string())?),
        Err(_) => None,
    };
    
    let mut parents = vec![];
    if let Some(ref parent) = parent_commit {
        parents.push(parent);
    }
    
    // parents is Vec<&Commit>
    repo.commit(
        Some("HEAD"),
        &signature,
        &signature,
        "Writizen publish: auto-commit",
        &tree,
        &parents,
    ).map_err(|e| e.message().to_string())?;
    
    // Push
    let mut remote = match repo.find_remote("origin") {
        Ok(r) => r,
        Err(_) => repo.remote("origin", &repo_url).map_err(|e| e.message().to_string())?,
    };
    
    // Ensure remote URL is updated if they changed it
    if remote.url() != Some(&repo_url) {
        repo.remote_set_url("origin", &repo_url).map_err(|e| e.message().to_string())?;
        remote = repo.find_remote("origin").map_err(|e| e.message().to_string())?;
    }
        
    let mut callbacks = RemoteCallbacks::new();
    callbacks.credentials(move |_url, username_from_url, _allowed_types| {
        // GitHub uses the PAT as the password, and username doesn't strictly matter for HTTPS PAT but "git" is standard
        Cred::userpass_plaintext(username_from_url.unwrap_or("git"), &pat)
    });
    
    let rejection_msg = std::sync::Arc::new(std::sync::Mutex::new(None));
    let rejection_clone = std::sync::Arc::clone(&rejection_msg);
    callbacks.push_update_reference(move |_refname, status| {
        if let Some(error_msg) = status {
            let mut lock = rejection_clone.lock().unwrap();
            *lock = Some(error_msg.to_string());
        }
        Ok(())
    });
    
    let mut push_opts = PushOptions::new();
    push_opts.remote_callbacks(callbacks);
    
    // Default to pushing the main branch if HEAD isn't available
    let branch_name = match repo.head() {
        Ok(head) => head.name().unwrap_or("refs/heads/main").to_string(),
        Err(_) => "refs/heads/main".to_string(),
    };
    // Include '+' prefix for force push if requested
    let refspec = if force {
        format!("+{}:{}", branch_name, branch_name)
    } else {
        format!("{}:{}", branch_name, branch_name)
    };
    
    remote.push(&[&refspec], Some(&mut push_opts)).map_err(|e| e.message().to_string())?;
    
    let locked_rejection = rejection_msg.lock().unwrap();
    if let Some(ref msg) = *locked_rejection {
        return Err(format!("GitHub rejected the push: {}", msg));
    }
    
    Ok("Success".to_string())
}

#[tauri::command]
fn get_config(vault_path: String) -> Result<String, String> {
    let mut config_path = std::path::PathBuf::from(&vault_path);
    config_path.push(".system");
    config_path.push("config.json");

    if !config_path.exists() {
        return Ok("{}".to_string());
    }

    std::fs::read_to_string(config_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_config(vault_path: String, config: String) -> Result<String, String> {
    let mut system_dir = std::path::PathBuf::from(&vault_path);
    system_dir.push(".system");

    if !system_dir.exists() {
        std::fs::create_dir_all(&system_dir).map_err(|e| e.to_string())?;
    }

    let mut config_path = system_dir.clone();
    config_path.push("config.json");

    std::fs::write(config_path, config).map_err(|e| e.to_string())?;
    
    Ok("Saved".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            git_init,
            git_status,
            git_commit_and_push,
            get_config,
            save_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
