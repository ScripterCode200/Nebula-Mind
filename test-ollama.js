async function testOllama() {
    const url = "https://integral-enabled-socket-ridge.trycloudflare.com/api/chat";
    console.log(`Testing Ollama URL: ${url}`);
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "phi3.5",
                messages: [{ role: "user", content: "Hello" }],
                stream: false
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        if (!response.ok) {
            const text = await response.text();
            console.log(`Error Body: ${text}`);
        } else {
            const data = await response.json();
            console.log(`Success! Response:`, data);
        }
    } catch (error) {
        console.error("Fetch error:", error.message);
    }
}

testOllama();
