import { AzureOpenAI } from "openai";

const fetchAIResponse = async (taskText, description) => {
  const endpoint = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.REACT_APP_AZURE_OPENAI_API_KEY;
  const deployment = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = "2024-05-01-preview";

  if (!endpoint || !apiKey || !deployment) {
    console.error("❌ Missing required environment variables");
    console.error({
      endpoint: !!endpoint,
      apiKey: !!apiKey,
      deployment: !!deployment,
    });
    throw new Error("Missing required environment variables");
  }

  console.log("🔹 Debugging API Call:");
  console.log("🔹 Endpoint:", endpoint);
  console.log("🔹 Deployment:", deployment);

  try {
    // Initialize the AzureOpenAI client with API key authentication
    const client = new AzureOpenAI({ 
      endpoint, 
      apiKey,
      apiVersion,
      deployment,
      dangerouslyAllowBrowser: true
    });

    const result = await client.chat.completions.create({
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
      max_tokens: 800,
      temperature: 0.7,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: null
    });

    console.log("🔹 Full API Response:", JSON.stringify(result, null, 2));

    if (!result.choices || result.choices.length === 0) {
      throw new Error("No AI response received.");
    }

    return result.choices[0].message.content.trim();
  } catch (error) {
    console.error("❌ Error fetching AI description:", error);
    console.error("Error details:", error.message);
    return "Error generating AI response.";
  }
};

export default fetchAIResponse;
