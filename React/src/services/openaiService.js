const fetchAIResponse = async (taskText, description) => {
  const API_KEY = process.env.REACT_APP_OPENAI_KEY;
  const API_URL = "https://revan-m7ydaljc-swedencentral.cognitiveservices.azure.com/openai/deployments/gpt-35-turbo/chat/completions?api-version=2024-10-21";

  console.log("🔹 Debugging API Call:");
  console.log("🔹 API Key:", API_KEY ? "Exists ✅" : "Missing ❌");
  console.log("🔹 Full API URL:", API_URL);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": API_KEY
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are a structured, helpful AI assistant specializing in task management and productivity. 
            Your primary goal is to provide concise, actionable guidance in a numbered list format.

            **Response Formatting:**
            - Always provide a **numbered list of practical tips**.
            - If relevant, include **useful references** (books, websites, or tools).
            - Keep responses **short, structured, and to the point**.
            - If the task involves coding, include **code snippets or links**.

            **Example Response Format:**
            ---
            **Task:** [Task Name]
            
            **Steps to Complete the Task:**
            1. [Step 1]
            2. [Step 2]
            3. [Step 3]
            
            **Helpful References:**
            - [Reference 1 - Website/Book/Tool]
            - [Reference 2 - Website/Book/Tool]
            `
          },
          {
            role: "user",
            content: `Task: ${taskText}
            
            ${description ? "Existing Description: " + description : ""}
            
            Provide a **short, numbered list of practical tips** to complete this task.
            
            If possible, include **useful references** such as books, websites, or tools.
            
            Format the response exactly as described in the instructions above.`
          }
        ],
        max_tokens: 250
      })
    });

    const data = await response.json();
    console.log("🔹 Full API Response:", data);

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No AI response received.");
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("❌ Error fetching AI description:", error);
    return "Error generating AI response.";
  }
};

export default fetchAIResponse;
