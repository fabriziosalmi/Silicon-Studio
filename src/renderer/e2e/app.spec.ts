import { test, expect } from '@playwright/test'
import { mockBackendAPIs, navigateTo } from './helpers'

test.beforeEach(async ({ page }) => {
  await mockBackendAPIs(page)
  await page.goto('/')
  // Wait for the sidebar nav to be visible (backend health check passed, loading screen gone)
  await expect(page.locator('nav')).toBeVisible({ timeout: 15_000 })
})

// ── App Shell ────────────────────────────────────────────

test.describe('App Shell', () => {
  test('renders the top bar with backend status', async ({ page }) => {
    await expect(page.getByText('Ready', { exact: true }).first()).toBeVisible()
  })

  test('renders the top bar with system stats', async ({ page }) => {
    await expect(page.getByText('RAM', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('CPU', { exact: true }).first()).toBeVisible()
  })

  test('renders the sidebar with all navigation items', async ({ page }) => {
    const sidebar = page.locator('nav')
    for (const label of ['Models', 'Chat', 'Terminal', 'Code', 'Notes',
      'Data Preparation', 'Fine-Tuning Engine', 'Model Evaluations',
      'RAG Knowledge', 'Agent Workflows', 'Deployment']) {
      await expect(sidebar.getByText(label, { exact: true }).first()).toBeVisible()
    }
  })

  test('defaults to Models tab on load', async ({ page }) => {
    await expect(page.getByText('My Models').first()).toBeVisible({ timeout: 5000 })
  })

  test('sidebar has Settings item', async ({ page }) => {
    // Settings is outside <nav>, at the bottom of the sidebar
    await expect(page.getByText('Settings', { exact: true }).first()).toBeVisible({ timeout: 5000 })
  })
})

// ── Models Page ──────────────────────────────────────────

test.describe('Models Page', () => {
  test('shows downloaded model in table', async ({ page }) => {
    await expect(page.getByText('Llama 3.2 3B Instruct', { exact: true })).toBeVisible({ timeout: 5000 })
  })

  test('shows model size', async ({ page }) => {
    await expect(page.getByText('1.8GB', { exact: true })).toBeVisible({ timeout: 5000 })
  })

  test('shows search input', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible({ timeout: 5000 })
  })

  test('search input accepts text', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('llama')
    await expect(searchInput).toHaveValue('llama')
  })

  test('search input with no match hides results', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('xyznonexistent')
    await expect(page.getByText('Llama 3.2 3B Instruct', { exact: true })).toBeHidden({ timeout: 5000 })
  })

  test('has My Models and Discover tabs', async ({ page }) => {
    await expect(page.getByText('My Models').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Discover').first()).toBeVisible({ timeout: 5000 })
  })

  test('can switch to Discover tab', async ({ page }) => {
    await page.getByText('Discover').first().click()
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible({ timeout: 5000 })
  })
})

// ── Chat Page ────────────────────────────────────────────

test.describe('Chat Page', () => {
  test('navigates to chat and shows empty state', async ({ page }) => {
    await navigateTo(page, 'Chat')
    await expect(page.getByText('No model loaded').first()).toBeVisible({ timeout: 5000 })
  })

  test('has a visible textarea', async ({ page }) => {
    await navigateTo(page, 'Chat')
    // Use :visible to avoid matching hidden Terminal textarea
    await expect(page.locator('textarea:visible').first()).toBeVisible({ timeout: 5000 })
  })

  test('textarea accepts input', async ({ page }) => {
    await navigateTo(page, 'Chat')
    const textarea = page.locator('textarea:visible').first()
    await textarea.click()
    await textarea.fill('hello world')
    await expect(textarea).toHaveValue('hello world')
  })

  test('shows Parameters button', async ({ page }) => {
    await navigateTo(page, 'Chat')
    await expect(page.locator('button:has-text("Parameters")')).toBeVisible({ timeout: 5000 })
  })

  test('opens parameters sidebar', async ({ page }) => {
    await navigateTo(page, 'Chat')
    await page.locator('button:has-text("Parameters")').click()
    await expect(page.locator('label:has-text("Temperature")')).toBeVisible({ timeout: 5000 })
  })

  test('shows reasoning control in parameters', async ({ page }) => {
    await navigateTo(page, 'Chat')
    await page.locator('button:has-text("Parameters")').click()
    await expect(page.getByText('Reasoning').first()).toBeVisible({ timeout: 5000 })
  })

  test('shows memory map toggle in parameters', async ({ page }) => {
    await navigateTo(page, 'Chat')
    await page.locator('button:has-text("Parameters")').click()
    await expect(page.getByText('Memory Map').first()).toBeVisible({ timeout: 5000 })
  })

  test('shows syntax check toggle in parameters', async ({ page }) => {
    await navigateTo(page, 'Chat')
    await page.locator('button:has-text("Parameters")').click()
    await expect(page.getByText('Syntax Check').first()).toBeVisible({ timeout: 5000 })
  })

  test('shows Ethical chip in visible actions', async ({ page }) => {
    await navigateTo(page, 'Chat')
    await page.locator('button:has-text("Parameters")').click()
    await expect(page.locator('button:has-text("Ethical")')).toBeVisible({ timeout: 5000 })
  })

  test('shows web search toggle in parameters', async ({ page }) => {
    await navigateTo(page, 'Chat')
    await page.locator('button:has-text("Parameters")').click()
    await expect(page.getByText('Web Search').first()).toBeVisible({ timeout: 5000 })
  })

  test('conversation history shown in sidebar on chat tab', async ({ page }) => {
    await navigateTo(page, 'Chat')
    await expect(page.locator('input[placeholder="Search conversations..."]')).toBeVisible({ timeout: 5000 })
  })

  test('shows conversations in sidebar', async ({ page }) => {
    await navigateTo(page, 'Chat')
    await expect(page.getByText('Test Conversation').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Pinned Chat').first()).toBeVisible({ timeout: 5000 })
  })
})

// ── Terminal Page ────────────────────────────────────────

test.describe('Terminal Page', () => {
  test('navigates to Terminal and shows input bar', async ({ page }) => {
    await navigateTo(page, 'Terminal')
    // The InputBar auto-resize useEffect can set textarea height to 0px in
    // headless Chromium when empty (scrollHeight=0 overrides rows={1}).
    // We verify the input bar container renders with mode buttons and prompt.
    await expect(page.locator('button[title="Send (Enter)"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('span:text-is("$")').first()).toBeVisible()
  })

  test('shows Terminal and Agent mode buttons', async ({ page }) => {
    await navigateTo(page, 'Terminal')
    const inputBar = page.locator('.px-4.py-3')
    await expect(inputBar.getByText('Terminal', { exact: true }).first()).toBeVisible({ timeout: 5000 })
    await expect(inputBar.getByText('Agent', { exact: true }).first()).toBeVisible({ timeout: 5000 })
  })

  test('textarea accepts input', async ({ page }) => {
    await navigateTo(page, 'Terminal')
    const textarea = page.locator('.px-4.py-3 textarea')
    // Force minimum height — the auto-resize effect may collapse it to 0px
    await textarea.evaluate((el: HTMLTextAreaElement) => {
      el.style.height = '24px'
    })
    await textarea.fill('ls -la')
    await expect(textarea).toHaveValue('ls -la')
  })

  test('mode switch changes prompt symbol', async ({ page }) => {
    await navigateTo(page, 'Terminal')
    // Verify terminal mode shows $ prompt
    await expect(page.locator('span:text-is("$")').first()).toBeVisible({ timeout: 5000 })

    // Switch to agent mode
    const inputBar = page.locator('.px-4.py-3')
    await inputBar.getByText('Agent', { exact: true }).first().click()

    // Agent mode shows > prompt
    await expect(page.locator('span:text-is(">")').first()).toBeVisible({ timeout: 5000 })
  })

  test('shows prompt symbol', async ({ page }) => {
    await navigateTo(page, 'Terminal')
    await expect(page.locator('span:text-is("$")').first()).toBeVisible({ timeout: 5000 })
  })

  test('has send button', async ({ page }) => {
    await navigateTo(page, 'Terminal')
    await expect(page.locator('button[title="Send (Enter)"]')).toBeVisible({ timeout: 5000 })
  })
})

// ── Code Page ────────────────────────────────────────────

test.describe('Code Page', () => {
  test('shows empty state when no workspace configured', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('silicon-studio-workspace-dir'))
    await navigateTo(page, 'Code')
    await expect(page.getByText('No workspace configured').or(
      page.getByText('Open Settings')
    ).first()).toBeVisible({ timeout: 8000 })
  })

  test('renders file tree when workspace is set', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('silicon-studio-workspace-dir', '/mock/project')
      window.dispatchEvent(new CustomEvent('workspace-dir-changed', { detail: '/mock/project' }))
    })
    await navigateTo(page, 'Code')
    await expect(page.getByText('src', { exact: true }).first()).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('README.md', { exact: true }).first()).toBeVisible({ timeout: 5000 })
  })

  test('depth-0 folders start expanded and can be collapsed', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('silicon-studio-workspace-dir', '/mock/project')
      window.dispatchEvent(new CustomEvent('workspace-dir-changed', { detail: '/mock/project' }))
    })
    await navigateTo(page, 'Code')
    // FileTree starts depth-0 folders expanded (useState(depth < 1))
    // so children should already be visible
    await expect(page.getByText('main.py', { exact: true }).first()).toBeVisible({ timeout: 8000 })

    // Click src folder to collapse it
    const srcFolder = page.locator('div[role="button"]').filter({ hasText: /^src$/ }).first()
    await srcFolder.click()
    await expect(page.getByText('main.py', { exact: true })).toBeHidden({ timeout: 5000 })

    // Click again to re-expand
    await srcFolder.click()
    await expect(page.getByText('main.py', { exact: true }).first()).toBeVisible({ timeout: 5000 })
  })

  test('clicking a file opens it in a tab', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('silicon-studio-workspace-dir', '/mock/project')
      window.dispatchEvent(new CustomEvent('workspace-dir-changed', { detail: '/mock/project' }))
    })
    await navigateTo(page, 'Code')
    await expect(page.getByText('README.md', { exact: true }).first()).toBeVisible({ timeout: 8000 })
    await page.getByText('README.md', { exact: true }).first().click()
    await expect(page.locator('span:has-text("README.md")').first()).toBeVisible({ timeout: 5000 })
  })
})

// ── Notes Page ───────────────────────────────────────────

test.describe('Notes Page', () => {
  test('navigates to notes and shows content', async ({ page }) => {
    await navigateTo(page, 'Notes')
    await expect(page.getByText('AI Commands').first()).toBeVisible({ timeout: 5000 })
  })

  test('shows import and export buttons', async ({ page }) => {
    await navigateTo(page, 'Notes')
    await expect(page.locator('button:has-text("Import")')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button:has-text(".md")')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button:has-text(".txt")')).toBeVisible({ timeout: 5000 })
  })

  test('shows AI commands', async ({ page }) => {
    await navigateTo(page, 'Notes')
    await expect(page.getByText('Continue Writing').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Summarize', { exact: true }).first()).toBeVisible({ timeout: 5000 })
  })

  test('has Send to Chat button', async ({ page }) => {
    await navigateTo(page, 'Notes')
    await expect(page.locator('button:has-text("Send to Chat")')).toBeVisible({ timeout: 5000 })
  })
})

// ── Data Preparation Page ────────────────────────────────

test.describe('Data Preparation Page', () => {
  test('navigates and shows content', async ({ page }) => {
    await navigateTo(page, 'Data Preparation')
    await expect(page.getByText('Import from File').first()).toBeVisible({ timeout: 5000 })
  })

  test('shows File and MCP mode toggle', async ({ page }) => {
    await navigateTo(page, 'Data Preparation')
    await expect(page.getByText('Import from File').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Generate via MCP').first()).toBeVisible({ timeout: 5000 })
  })

  test('shows file picker buttons', async ({ page }) => {
    await navigateTo(page, 'Data Preparation')
    await expect(page.getByText('Select File...').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Select Folder...').first()).toBeVisible({ timeout: 5000 })
  })
})

// ── Fine-Tuning Engine Page ──────────────────────────────

test.describe('Fine-Tuning Engine Page', () => {
  test('navigates and shows content', async ({ page }) => {
    await navigateTo(page, 'Fine-Tuning Engine')
    await expect(page.getByText('Job Configuration').first()).toBeVisible({ timeout: 5000 })
  })

  test('shows hyperparameter controls', async ({ page }) => {
    await navigateTo(page, 'Fine-Tuning Engine')
    await expect(page.getByText('Hyperparameters', { exact: true }).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('LoRA Specifics').first()).toBeVisible({ timeout: 5000 })
  })

  test('has preset selector defaulting to balanced', async ({ page }) => {
    await navigateTo(page, 'Fine-Tuning Engine')
    const presetSelect = page.locator('select[title="Hyperparameters Preset"]')
    await expect(presetSelect).toBeVisible({ timeout: 5000 })
    await expect(presetSelect).toHaveValue('balanced')
  })

  test('preset selector can change to draft', async ({ page }) => {
    await navigateTo(page, 'Fine-Tuning Engine')
    const presetSelect = page.locator('select[title="Hyperparameters Preset"]')
    await presetSelect.selectOption('draft')
    await expect(presetSelect).toHaveValue('draft')
  })

  test('has start training button', async ({ page }) => {
    await navigateTo(page, 'Fine-Tuning Engine')
    await expect(page.locator('button:has-text("Start Training Job")')).toBeVisible({ timeout: 5000 })
  })

  test('shows training chart area', async ({ page }) => {
    await navigateTo(page, 'Fine-Tuning Engine')
    await expect(page.getByText('Real-time Training Loss').first()).toBeVisible({ timeout: 5000 })
  })
})

// ── Model Export Page ────────────────────────────────────

test.describe('Model Export Page', () => {
  test('navigates and shows header', async ({ page }) => {
    await navigateTo(page, 'Model Export')
    await expect(page.locator('h2:has-text("Model Export")')).toBeVisible({ timeout: 5000 })
  })

  test('shows quantization options', async ({ page }) => {
    await navigateTo(page, 'Model Export')
    await expect(page.getByText('4-bit').or(page.getByText('4 bit')).first()).toBeVisible({ timeout: 5000 })
  })

  test('has export button', async ({ page }) => {
    await navigateTo(page, 'Model Export')
    await expect(page.locator('button:has-text("Export")')).toBeVisible({ timeout: 5000 })
  })
})

// ── Model Evaluations Page ───────────────────────────────

test.describe('Model Evaluations Page', () => {
  test('navigates and shows content', async ({ page }) => {
    await navigateTo(page, 'Model Evaluations')
    await expect(page.getByText('Standard Benchmarks').first()).toBeVisible({ timeout: 5000 })
  })

  test('shows benchmark cards', async ({ page }) => {
    await navigateTo(page, 'Model Evaluations')
    await expect(page.getByText('MMLU').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('HellaSwag').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('HumanEval').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('TruthfulQA').first()).toBeVisible({ timeout: 5000 })
  })
})

// ── RAG Knowledge Page ───────────────────────────────────

test.describe('RAG Knowledge Page', () => {
  test('navigates and shows content', async ({ page }) => {
    await navigateTo(page, 'RAG Knowledge')
    await expect(page.getByText('Vector Collections').first()).toBeVisible({ timeout: 5000 })
  })

  test('shows collection in table', async ({ page }) => {
    await navigateTo(page, 'RAG Knowledge')
    await expect(page.getByText('Legal Docs').first()).toBeVisible({ timeout: 5000 })
  })

  test('has new collection button', async ({ page }) => {
    await navigateTo(page, 'RAG Knowledge')
    await expect(page.locator('button:has-text("New Collection")')).toBeVisible({ timeout: 5000 })
  })

  test('shows data ingestion tab content', async ({ page }) => {
    await navigateTo(page, 'RAG Knowledge')
    await page.getByText('Data Ingestion').first().click()
    await expect(page.getByText('Upload Files for Embedding').first()).toBeVisible({ timeout: 5000 })
  })

  test('new collection modal opens and closes', async ({ page }) => {
    await navigateTo(page, 'RAG Knowledge')
    await page.locator('button:has-text("New Collection")').click()
    await expect(page.getByText('New Vector Collection').first()).toBeVisible()
    await page.locator('button:has-text("Cancel")').click()
    await expect(page.getByText('New Vector Collection')).toBeHidden()
  })

  test('data ingestion tab has ingest button', async ({ page }) => {
    await navigateTo(page, 'RAG Knowledge')
    await page.getByText('Data Ingestion').first().click()
    await expect(page.locator('button:has-text("Ingest")')).toBeVisible({ timeout: 5000 })
  })
})

// ── Agent Workflows Page ─────────────────────────────────

test.describe('Agent Workflows Page', () => {
  test('navigates and shows content', async ({ page }) => {
    await navigateTo(page, 'Agent Workflows')
    await expect(page.getByText('Saved Pipelines').or(
      page.getByText('Research Agent')
    ).first()).toBeVisible({ timeout: 5000 })
  })

  test('shows sample agent from mock data', async ({ page }) => {
    await navigateTo(page, 'Agent Workflows')
    await expect(page.getByText('Research Agent').first()).toBeVisible({ timeout: 5000 })
  })

  test('has search input that accepts text', async ({ page }) => {
    await navigateTo(page, 'Agent Workflows')
    const searchInput = page.locator('input[placeholder*="earch"]').first()
    await searchInput.fill('research')
    await expect(searchInput).toHaveValue('research')
  })
})

// ── Deployment Page ──────────────────────────────────────

test.describe('Deployment Page', () => {
  test('navigates and shows start server button', async ({ page }) => {
    await navigateTo(page, 'Deployment')
    await expect(page.locator('button:has-text("Start Server")')).toBeVisible({ timeout: 5000 })
  })

  test('shows host selector with default value', async ({ page }) => {
    await navigateTo(page, 'Deployment')
    const hostSelect = page.locator('select[title="Bind address"]')
    await expect(hostSelect).toBeVisible({ timeout: 5000 })
    await expect(hostSelect).toHaveValue('127.0.0.1')
  })

  test('host selector can change to 0.0.0.0', async ({ page }) => {
    await navigateTo(page, 'Deployment')
    const hostSelect = page.locator('select[title="Bind address"]')
    await hostSelect.selectOption('0.0.0.0')
    await expect(hostSelect).toHaveValue('0.0.0.0')
  })

  test('shows port input with default value', async ({ page }) => {
    await navigateTo(page, 'Deployment')
    const portInput = page.locator('input[title="Port"]')
    await expect(portInput).toBeVisible({ timeout: 5000 })
    await expect(portInput).toHaveValue('8080')
  })

  test('port input accepts changes', async ({ page }) => {
    await navigateTo(page, 'Deployment')
    const portInput = page.locator('input[title="Port"]')
    await portInput.clear()
    await portInput.fill('9090')
    await expect(portInput).toHaveValue('9090')
  })
})

// ── Settings Page ────────────────────────────────────────

test.describe('Settings Page', () => {
  test('navigates to Settings', async ({ page }) => {
    await navigateTo(page, 'Settings')
    await expect(page.getByText('CHAT DEFAULTS').or(page.getByText('Chat Defaults')).first()).toBeVisible({ timeout: 5000 })
  })

  test('shows system prompt textarea', async ({ page }) => {
    await navigateTo(page, 'Settings')
    const systemPrompt = page.locator('textarea:visible').first()
    await expect(systemPrompt).toBeVisible({ timeout: 5000 })
  })

  test('system prompt accepts input', async ({ page }) => {
    await navigateTo(page, 'Settings')
    const systemPrompt = page.locator('textarea:visible').first()
    await systemPrompt.clear()
    await systemPrompt.fill('You are a test assistant.')
    await expect(systemPrompt).toHaveValue('You are a test assistant.')
  })

  test('shows temperature control', async ({ page }) => {
    await navigateTo(page, 'Settings')
    await expect(page.locator('label:has-text("TEMPERATURE")').or(
      page.locator('label:has-text("Temperature")')
    ).first()).toBeVisible({ timeout: 5000 })
  })

  test('shows max tokens control', async ({ page }) => {
    await navigateTo(page, 'Settings')
    await expect(page.locator('label:has-text("MAX TOKENS")').or(
      page.locator('label:has-text("Max Tokens")')
    ).first()).toBeVisible({ timeout: 5000 })
  })

  test('shows reasoning mode control', async ({ page }) => {
    await navigateTo(page, 'Settings')
    await expect(page.locator('label:has-text("REASONING")').or(
      page.locator('label:has-text("Reasoning")')
    ).first()).toBeVisible({ timeout: 5000 })
  })
})

// ── Navigation Round-Trip ────────────────────────────────

test.describe('Navigation', () => {
  test('can switch between all tabs without errors', async ({ page }) => {
    const tabs = [
      { label: 'Chat', verify: 'text=No model loaded' },
      { label: 'Terminal', verify: 'button[title="Send (Enter)"]' },
      { label: 'Notes', verify: 'text=AI Commands' },
      { label: 'Data Preparation', verify: 'text=Import from File' },
      { label: 'Fine-Tuning Engine', verify: 'text=Job Configuration' },
      { label: 'Model Export', verify: 'h2:has-text("Model Export")' },
      { label: 'Model Evaluations', verify: 'text=Standard Benchmarks' },
      { label: 'RAG Knowledge', verify: 'text=Vector Collections' },
      { label: 'Agent Workflows', verify: 'text=Saved Pipelines' },
      { label: 'Deployment', verify: 'button:has-text("Start Server")' },
      { label: 'Settings', verify: 'textarea:visible' },
      { label: 'Models', verify: 'text=My Models' },
    ]

    for (const tab of tabs) {
      await navigateTo(page, tab.label)
      await expect(page.locator(tab.verify).first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('no console errors during navigation', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // Ignore benign network errors from mock gaps
        if (text.includes('net::ERR') || text.includes('Failed to fetch') || text.includes('favicon')) return
        errors.push(text)
      }
    })

    const tabs = ['Chat', 'Terminal', 'Code', 'Notes', 'Data Preparation',
      'Fine-Tuning Engine', 'Model Export', 'Model Evaluations',
      'RAG Knowledge', 'Agent Workflows', 'Deployment', 'Settings', 'Models']

    for (const tab of tabs) {
      await navigateTo(page, tab)
      await page.waitForTimeout(300)
    }

    expect(errors).toEqual([])
  })
})
