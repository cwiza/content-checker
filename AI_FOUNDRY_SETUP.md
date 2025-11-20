# Adding Content Validator to AI Foundry Agent

## Step 1: Add the Tool in AI Foundry Portal

1. Go to https://ai.azure.com
2. Navigate to your project
3. Click on **"Agents"** in the left sidebar
4. Select your agent
5. Click **"Tools"** or **"Functions"** tab
6. Click **"Add function"** or **"+ New tool"**
7. Paste this JSON:

```json
{
  "type": "function",
  "function": {
    "name": "validate_content",
    "description": "Validate text content for spelling errors, grammar mistakes, honorifics (Mr., Dr., etc.), placeholder text (TODO, TBD, FIXME), and capitalization issues. Returns detailed issues with suggestions for fixes.",
    "parameters": {
      "type": "object",
      "properties": {
        "content": {
          "type": "string",
          "description": "The text content to validate"
        }
      },
      "required": ["content"]
    }
  }
}
```

8. Click **"Save"**

## Step 2: Update Agent Instructions

In your agent's **System message** or **Instructions**, add:

```
When writing or editing content, ALWAYS use the validate_content function to check for:
- Spelling errors
- Grammar mistakes
- Honorifics (Mr., Dr., etc.) that should be removed for inclusivity
- Placeholder text (TODO, FIXME, TBD)
- Capitalization issues

If validation returns issues, fix them and re-validate before presenting final content to the user.
```

## Step 3: Implement the Function Handler

**IMPORTANT:** AI Foundry agents need a backend to execute functions. You have two options:

### Option A: Use Azure Functions (Recommended for AI Foundry)

1. Create an Azure Function App
2. Deploy this function:

```python
import azure.functions as func
import json
import subprocess
import tempfile
import os

app = func.FunctionApp()

@app.function_name(name="validate_content")
@app.route(route="validate", methods=["POST"])
def validate_content(req: func.HttpRequest) -> func.HttpResponse:
    try:
        data = req.get_json()
        content = data.get('content', '')
        
        # Write content to temp file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
            f.write(content)
            temp_path = f.name
        
        # Run validator (assumes .github folder is deployed with function)
        result = subprocess.run(
            ['node', '.github/scripts/validate-file.js', temp_path],
            capture_output=True,
            text=True
        )
        
        os.unlink(temp_path)
        
        if result.returncode == 0:
            return func.HttpResponse(
                json.dumps({"status": "pass", "issues": [], "message": "✅ No issues"}),
                mimetype="application/json"
            )
        else:
            # Parse issues from output
            issues = []
            for line in result.stdout.split('\n'):
                if '🔴' in line or '🟡' in line:
                    issues.append(line.strip())
            
            return func.HttpResponse(
                json.dumps({"status": "fail", "issues": issues, "message": f"Found {len(issues)} issues"}),
                mimetype="application/json"
            )
    except Exception as e:
        return func.HttpResponse(f"Error: {str(e)}", status_code=500)
```

3. In AI Foundry, configure the function URL in your agent's function settings

### Option B: Use AI Foundry Code Interpreter (Simpler but Limited)

If your agent has **Code Interpreter** enabled, it can run validation directly:

Update your agent instructions to:
```
When writing content, validate it by running this Python code:

import subprocess
import tempfile

# Write content to temp file
with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
    f.write(content)
    temp_path = f.name

# Run validator
result = subprocess.run(['node', '.github/scripts/validate-file.js', temp_path], 
                       capture_output=True, text=True)
print(result.stdout)
```

## Step 4: Test Your Agent

Ask your agent:
```
Write a paragraph about machine learning. Make sure to validate it.
```

The agent should:
1. Generate content
2. Call validate_content function
3. Fix any issues found
4. Return clean, validated content

---

**Quick Question:** Do you want to:
- **A)** Set up Azure Functions (more robust, works for any agent)
- **B)** Use Code Interpreter (simpler, if your agent supports it)
- **C)** Just add the tool definition for now and handle execution later

Let me know and I'll guide you through the specific steps!
