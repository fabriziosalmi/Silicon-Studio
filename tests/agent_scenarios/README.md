# NanoCore Agent Test Scenarios

10 test files to exercise the agent from simple single-tool tasks to complex multi-turn workflows.

## How to test
1. Open a file in the Code workspace
2. Use the prompt listed below
3. Check that the agent uses the right tools (patch_file, run_bash, etc.)
4. Verify the result is correct

## Scenarios

| # | File | Difficulty | Tools Expected | Prompt |
|---|------|-----------|----------------|--------|
| 1 | `01_fix_syntax.py` | Easy | patch_file | "fix the syntax error in this file" |
| 2 | `02_add_docstrings.py` | Easy | patch_file | "add docstrings to all functions" |
| 3 | `03_fix_bug.py` | Easy-Med | patch_file | "the function returns wrong results, fix it" |
| 4 | `04_refactor_class.py` | Medium | edit_file or patch_file | "refactor these functions into a Calculator class" |
| 5 | `05_add_error_handling.py` | Medium | patch_file | "add proper error handling to all functions" |
| 6 | `06_write_tests.py` | Medium | edit_file (new file) | "write pytest tests for all functions in this file" |
| 7 | `07_optimize_performance.py` | Med-Hard | patch_file | "optimize these functions for better performance" |
| 8 | `08_multi_file_api.py` | Hard | run_bash + read_file + patch_file | "run this file, fix all errors" |
| 9 | `09_implement_feature.py` | Hard | patch_file (multiple) | "implement the missing methods marked with TODO" |
| 10 | `10_debug_and_extend.py` | Hard (multi-turn) | run_bash + patch_file + run_bash | "run this file, fix all errors, then add a search method and to_json method" |

## What to look for
- Does the agent use tools or just describe changes?
- Are patches correct and minimal?
- Does the agent verify its work (run the file after patching)?
- Multi-turn: does it handle error → fix → retry loops?
- Does it preserve code it doesn't need to change?
