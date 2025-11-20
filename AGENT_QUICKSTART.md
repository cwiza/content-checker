# Step-by-Step: Integrate Content Validator with Azure AI Foundry Agent

## Prerequisites
- Azure AI Foundry project created
- Python 3.8+
- Node.js installed (for the validator script)

## Step 1: Install Python SDK

```bash
pip install azure-ai-projects azure-identity
```

## Step 2: Copy Files to Your Agent Project

```bash
# Copy the validator tool to your agent project
cp foundry-agent-tool.py /path/to/your-agent-project/
cp -r .github /path/to/your-agent-project/
```

## Step 3: Create Your Agent with the Tool

Save this as `my_content_agent.py`:

```python
import os
import json
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential
from foundry_agent_tool import validate_content_tool, TOOL_CONFIG

# Connect to Azure AI Foundry
credential = DefaultAzureCredential()
project_client = AIProjectClient(
    credential=credential,
    subscription_id="YOUR_SUBSCRIPTION_ID",
    resource_group_name="YOUR_RESOURCE_GROUP",
    project_name="YOUR_PROJECT_NAME"
)

# Create agent with validation tool
agent = project_client.agents.create_agent(
    model="gpt-4o",  # or your preferred model
    name="Content Validator Agent",
    instructions="""You are a professional content writer and editor.

When creating or editing content:
1. Generate the content based on user request
2. ALWAYS use the validate_content tool to check for errors
3. If validation finds issues, fix them and re-validate
4. Only return content that passes validation

Use the validate_content tool for all text you write.""",
    tools=[TOOL_CONFIG]
)

print(f"✅ Agent created: {agent.id}")

# Create a thread for conversation
thread = project_client.agents.create_thread()

# Example: Ask agent to write content
message = project_client.agents.create_message(
    thread_id=thread.id,
    role="user",
    content="Write a short paragraph about machine learning."
)

# Run the agent
run = project_client.agents.create_run(
    thread_id=thread.id,
    assistant_id=agent.id
)

# Handle tool calls
import time
while run.status in ["queued", "in_progress", "requires_action"]:
    time.sleep(1)
    run = project_client.agents.get_run(thread_id=thread.id, run_id=run.id)
    
    if run.status == "requires_action":
        tool_outputs = []
        
        for tool_call in run.required_action.submit_tool_outputs.tool_calls:
            if tool_call.function.name == "validate_content":
                # Parse arguments
                args = json.loads(tool_call.function.arguments)
                
                # Call our validation tool
                result = validate_content_tool(
                    content=args.get("content"),
                    filename=args.get("filename", "content.md")
                )
                
                tool_outputs.append({
                    "tool_call_id": tool_call.id,
                    "output": json.dumps(result)
                })
        
        # Submit tool outputs back to agent
        run = project_client.agents.submit_tool_outputs(
            thread_id=thread.id,
            run_id=run.id,
            tool_outputs=tool_outputs
        )

# Get the final response
messages = project_client.agents.list_messages(thread_id=thread.id)
for msg in messages.data:
    if msg.role == "assistant":
        print(f"\n🤖 Agent: {msg.content[0].text.value}")
```

## Step 4: Set Azure Credentials

```bash
# Option 1: Use Azure CLI
az login

# Option 2: Set environment variables
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_RESOURCE_GROUP="your-resource-group"
export AZURE_PROJECT_NAME="your-project-name"
```

## Step 5: Run Your Agent

```bash
python my_content_agent.py
```

## What Happens:

1. Agent receives: "Write a short paragraph about machine learning"
2. Agent generates content
3. Agent calls `validate_content` tool automatically
4. If issues found → Agent fixes them → Re-validates
5. Returns validated, error-free content

## Simpler Alternative: Direct Tool Call

If you just want to validate content without a full agent:

```python
from foundry_agent_tool import validate_content_tool

# Direct validation
content = """
This is a test document with recieve spelled wrong.
Mr. Smith will review it.
TODO: Add more content
"""

result = validate_content_tool(content)
print(json.dumps(result, indent=2))
```

Run it:
```bash
python -c "from foundry_agent_tool import validate_content_tool; import json; print(json.dumps(validate_content_tool('recieve and Mr. Smith'), indent=2))"
```

## Troubleshooting

**"Module not found: foundry_agent_tool"**
- Make sure `foundry-agent-tool.py` is in the same directory
- Or install it: `pip install -e .`

**"Node.js script not found"**
- Ensure `.github/scripts/validate-file.js` exists
- Update the path in `foundry-agent-tool.py` if needed

**Agent not calling the tool**
- Make sure tool instructions are in the system prompt
- Check that `TOOL_CONFIG` is in the `tools` array

## Next Steps

- Add validation to your existing agents
- Customize the validation rules in `.github/scripts/validate-file.js`
- Add more tools for your agent to use
