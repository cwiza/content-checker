# Azure AI Foundry Agent Integration

## Quick Setup

### 1. Add Tool to Your Agent

In your Azure AI Foundry agent code:

```python
from foundry_agent_tool import validate_content_tool, TOOL_CONFIG

# Register the tool with your agent
agent = Agent(
    model="gpt-4",
    tools=[
        TOOL_CONFIG,
        # ... your other tools
    ]
)

# Tool execution handler
def execute_tool(tool_name: str, arguments: dict):
    if tool_name == "validate_content":
        return validate_content_tool(**arguments)
    # ... other tool handlers
```

### 2. Alternative: Azure AI Projects SDK

```python
from azure.ai.projects import AIProjectClient
from foundry_agent_tool import validate_content_tool, TOOL_CONFIG

client = AIProjectClient.from_connection_string("your-connection-string")

# Create agent with validation tool
agent = client.agents.create_agent(
    model="gpt-4",
    name="Content Writer Agent",
    instructions="You are a content writer. Always validate content before finalizing.",
    tools=[TOOL_CONFIG]
)

# In your agent loop
if tool_call.function.name == "validate_content":
    result = validate_content_tool(**json.loads(tool_call.function.arguments))
    client.agents.submit_tool_outputs(
        thread_id=thread.id,
        run_id=run.id,
        tool_outputs=[{
            "tool_call_id": tool_call.id,
            "output": json.dumps(result)
        }]
    )
```

### 3. Agent Prompt Example

Add this to your agent's system prompt:

```
When writing or editing content, use the validate_content tool to check for:
- Spelling errors
- Grammar mistakes  
- Honorifics (Mr., Dr., etc.) that should be removed
- Placeholder text (TODO, FIXME, TBD)
- Capitalization issues

If validation fails, fix the issues and re-validate before presenting the final content.
```

## Example Usage

```python
# Agent workflow
content = agent.generate_content("Write a blog post about AI")

# Validate before returning
validation = validate_content_tool(content)

if validation["status"] == "fail":
    # Ask agent to fix issues
    fixes = agent.fix_content(content, validation["issues"])
    validation = validate_content_tool(fixes)

return content if validation["status"] == "pass" else None
```

## Test It

```bash
python foundry-agent-tool.py
```

Expected output:
```json
{
  "status": "fail",
  "issues": [
    {
      "severity": "high",
      "message": "Line 4: Spelling error: \"recieve\"",
      "suggestion": "Did you mean \"receive\"?"
    },
    {
      "severity": "critical",
      "message": "Line 4: Honorific detected: Mr.. Remove for inclusivity.",
      "suggestion": "Use first name or full name without honorific"
    }
  ],
  "message": "❌ Found 2 validation issue(s)"
}
```
