"""
Azure AI Foundry Agent Tool for Content Validation
Exposes the content validator as a tool/function that agents can call
"""

import subprocess
import json
from typing import Dict, List, Any

def validate_content_tool(content: str, filename: str = "content.md") -> Dict[str, Any]:
    """
    Validate content for spelling, grammar, honorifics, and placeholder text.
    
    Args:
        content: The text content to validate
        filename: Optional filename (default: content.md)
    
    Returns:
        Dictionary with validation results including issues found
    """
    # Write content to temp file
    import tempfile
    import os
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
        f.write(content)
        temp_path = f.name
    
    try:
        # Run the validator
        result = subprocess.run(
            ['node', '.github/scripts/validate-file.js', temp_path],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        
        # Parse output
        output = result.stdout + result.stderr
        
        if result.returncode == 0:
            return {
                "status": "pass",
                "issues": [],
                "message": "✅ No validation issues found"
            }
        else:
            # Extract issues from output
            issues = []
            lines = output.split('\n')
            for i, line in enumerate(lines):
                if '🔴' in line or '🟡' in line or '🔵' in line or '🟠' in line:
                    severity = 'critical' if '🔴' in line else 'high' if '🟡' in line else 'medium' if '🔵' in line else 'low'
                    issues.append({
                        'severity': severity,
                        'message': line.replace('🔴', '').replace('🟡', '').replace('🔵', '').replace('🟠', '').strip(),
                        'suggestion': lines[i+1].replace('💡', '').strip() if i+1 < len(lines) and '💡' in lines[i+1] else None
                    })
            
            return {
                "status": "fail",
                "issues": issues,
                "message": f"❌ Found {len(issues)} validation issue(s)"
            }
    finally:
        # Clean up temp file
        os.unlink(temp_path)


# Azure AI Foundry tool configuration
TOOL_CONFIG = {
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
                },
                "filename": {
                    "type": "string",
                    "description": "Optional filename for context (e.g., 'README.md')",
                    "default": "content.md"
                }
            },
            "required": ["content"]
        }
    }
}


if __name__ == "__main__":
    # Test the tool
    test_content = """
    # Test Document
    
    This document has recieve and Mr. Smith mentioned.
    TODO: Add more content here
    this sentence needs capitalization.
    """
    
    result = validate_content_tool(test_content)
    print(json.dumps(result, indent=2))
