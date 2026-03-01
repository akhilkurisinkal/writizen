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
fn git_commit_and_push(path: String, repo_url: String, pat: String, author_name: String, author_email: String, _force: bool) -> Result<String, String> {
    let repo = match Repository::open(&path) {
        Ok(r) => r,
        Err(_) => {
            let mut opts = git2::RepositoryInitOptions::new();
            opts.initial_head("main");
            Repository::init_opts(&path, &opts).map_err(|e| format!("Failed to init repo at {}: {}", path, e.message()))?
        }
    };

    // 1. Setup Remote
    let mut remote = match repo.find_remote("origin") {
        Ok(r) => r,
        Err(_) => repo.remote("origin", &repo_url).map_err(|e| e.message().to_string())?,
    };

    if remote.url() != Some(&repo_url) {
        repo.remote_set_url("origin", &repo_url).map_err(|e| e.message().to_string())?;
        remote = repo.find_remote("origin").map_err(|e| e.message().to_string())?;
    }

    // 2. Setup Credentials
    let mut callbacks = RemoteCallbacks::new();
    let pat_clone = pat.clone();
    callbacks.credentials(move |_url, username_from_url, _allowed_types| {
        Cred::userpass_plaintext(username_from_url.unwrap_or("git"), &pat_clone)
    });

    // 3. Fetch Remote to find the current state
    let mut fetch_opts = git2::FetchOptions::new();
    fetch_opts.remote_callbacks(callbacks);
    
    // Determine branch name (default to main)
    let branch_name = "main"; 
    let remote_ref = format!("refs/remotes/origin/{}", branch_name);
    
    // Fetch might fail if repo is empty, which is okay
    let _ = remote.fetch(&[branch_name], Some(&mut fetch_opts), None);

    // 4. Find the remote parent commit (Tree Replacement Strategy)
    let parent_commit = match repo.find_reference(&remote_ref) {
        Ok(reference) => Some(reference.peel_to_commit().map_err(|e| e.message().to_string())?),
        Err(_) => {
            // If remote ref doesn't exist, check local HEAD for initial commit
            match repo.head() {
                Ok(head) => Some(head.peel_to_commit().map_err(|e| e.message().to_string())?),
                Err(_) => None,
            }
        }
    };

    // 5. Stage changes
    let mut index = repo.index().map_err(|e| e.message().to_string())?;
    index.add_all(["."].iter(), git2::IndexAddOption::DEFAULT, None).map_err(|e| e.message().to_string())?;
    index.write().map_err(|e| e.message().to_string())?;
    
    // 6. Create Tree and Commit (Update Ref is None to avoid safety checks)
    let oid = index.write_tree().map_err(|e| e.message().to_string())?;
    let tree = repo.find_tree(oid).map_err(|e| e.message().to_string())?;
    
    let safe_name = if author_name.trim().is_empty() { "Writizen User" } else { &author_name };
    let safe_email = if author_email.trim().is_empty() { "user@writizen.local" } else { &author_email };
    let signature = Signature::now(safe_name, safe_email).map_err(|e| e.message().to_string())?;
    
    let mut parents = vec![];
    if let Some(ref parent) = parent_commit {
        parents.push(parent);
    }
    
    let commit_oid = repo.commit(
        None, // Do NOT update HEAD/Ref automatically here
        &signature,
        &signature,
        "Writizen publish: auto-commit (tree-replacement)",
        &tree,
        &parents,
    ).map_err(|e| e.message().to_string())?;

    // 7. Manually update the local branch reference and HEAD
    let ref_name = format!("refs/heads/{}", branch_name);
    repo.reference(&ref_name, commit_oid, true, "Writizen: update branch pointer")
        .map_err(|e| e.message().to_string())?;
    repo.set_head(&ref_name).map_err(|e| e.message().to_string())?;
    
    // 8. Push
    let mut push_callbacks = RemoteCallbacks::new();
    push_callbacks.credentials(move |_url, username_from_url, _allowed_types| {
        Cred::userpass_plaintext(username_from_url.unwrap_or("git"), &pat)
    });

    let rejection_msg = std::sync::Arc::new(std::sync::Mutex::new(None));
    let rejection_clone = std::sync::Arc::clone(&rejection_msg);
    push_callbacks.push_update_reference(move |_refname, status| {
        if let Some(error_msg) = status {
            let mut lock = rejection_clone.lock().unwrap();
            *lock = Some(error_msg.to_string());
        }
        Ok(())
    });
    
    let mut push_opts = PushOptions::new();
    push_opts.remote_callbacks(push_callbacks);
    
    let refspec = format!("{}:{}", ref_name, ref_name);
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
