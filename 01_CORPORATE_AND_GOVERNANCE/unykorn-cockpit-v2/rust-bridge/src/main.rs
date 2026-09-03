use serde::{Deserialize, Serialize};
use std::env;

#[derive(Serialize)]
struct OpenRouterMessage {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct OpenRouterRequest {
    model: String,
    messages: Vec<OpenRouterMessage>,
}

#[derive(Deserialize, Debug)]
struct Choice {
    message: MessageContent,
}

#[derive(Deserialize, Debug)]
struct MessageContent {
    content: String,
}

#[derive(Deserialize, Debug)]
struct OpenRouterResponse {
    choices: Vec<Choice>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Extract environment keys and check core cockpit visibility
    let api_key = env::var("OPENROUTER_API_KEY")
        .expect("CRITICAL: OPENROUTER_API_KEY environment variable not set.");
    
    let target_model = env::var("DEFAULT_REMOTE_MODEL")
        .unwrap_or_else(|_| "anthropic/claude-3.5-sonnet".to_string());

    println!("[UnyKorn Cockpit] Initializing Anti-Gravity Compute Line...");
    println!("[System Status] 4/12 Systems Live. Routing out through OpenRouter balance.");

    // 2. Prepare payload passing local 653 vector memory context signature
    let system_prompt = "You are the primary cockpit intelligence interface for UnyKorn. \
                         Local infrastructure is degraded. Operating via OpenRouter compute plane.";
    let user_prompt = "Analyze the degraded x402 revenue rail and provide a telemetry recovery sweep protocol.";

    let payload = OpenRouterRequest {
        model: target_model,
        messages: vec![
            OpenRouterMessage { role: "system".to_string(), content: system_prompt.to_string() },
            OpenRouterMessage { role: "user".to_string(), content: user_prompt.to_string() },
        ],
    };

    // 3. Dispatch secure transaction client
    let client = reqwest::Client::new();
    let response = client
        .post("https://openrouter.ai/api/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("HTTP-Referer", "https://platform.unykorn.org")
        .header("X-Title", "UnyKorn Cockpit v2")
        .json(&payload)
        .send()
        .await?;

    if response.status().is_success() {
        let parsed: OpenRouterResponse = response.json().await?;
        println!("\n⚡ [OpenRouter Response Stream]:");
        println!("{}", parsed.choices[0].message.content);
    } else {
        let error_body = response.text().await?;
        eprintln!("❌ Compute Relay Failure: {}", error_body);
    }

    Ok(())
}
