import { Page } from '@playwright/test'

/**
 * Mock all backend API responses so the app can render without a real backend.
 * Call this in beforeEach for every test file.
 */
export async function mockBackendAPIs(page: Page) {
  // Health check — makes the app pass the loading screen
  await page.route('**/health', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok', service: 'silicon-studio-engine' }),
    })
  )

  // Monitor stats
  await page.route('**/api/monitor/stats', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        memory: { total: 36_000_000_000, available: 20_000_000_000, used: 16_000_000_000, percent: 44.4 },
        cpu: { cores: 10, percent: 12.5 },
        disk: { total: 500_000_000_000, free: 200_000_000_000, used: 300_000_000_000, percent: 60 },
        platform: { system: 'Darwin', processor: 'Apple M3 Max' },
      }),
    })
  )

  // Engine models
  await page.route('**/api/engine/models', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'mlx-community/Llama-3.2-3B-Instruct-4bit',
            name: 'Llama 3.2 3B Instruct',
            size: '1.8GB',
            family: 'Llama',
            architecture: 'LlamaForCausalLM',
            context_window: '4096',
            quantization: '4-bit',
            downloaded: true,
            downloading: false,
            local_path: '/mock/models/llama',
          },
          {
            id: 'mlx-community/Mistral-7B-Instruct-v0.3-4bit',
            name: 'Mistral 7B Instruct',
            size: '4.1GB',
            family: 'Mistral',
            downloaded: false,
            downloading: false,
            local_path: null,
          },
        ]),
      })
    }
    return route.continue()
  })

  // Engine model load
  await page.route('**/api/engine/models/load', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'loaded',
        model_id: 'mlx-community/Llama-3.2-3B-Instruct-4bit',
        context_window: 4096,
        architecture: 'LlamaForCausalLM',
        is_vision: false,
      }),
    })
  )

  // Engine model unload
  await page.route('**/api/engine/models/unload', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'unloaded' }),
    })
  )

  // Engine model delete
  await page.route('**/api/engine/models/delete', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'deleted', model_id: 'test' }),
    })
  )

  // Engine adapters (fine-tuned models for export page)
  await page.route('**/api/engine/models/adapters', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'ft-llama-legal',
          name: 'Llama Legal Fine-tune',
          size: '2.1GB',
          downloaded: true,
          downloading: false,
          is_finetuned: true,
          base_model: 'mlx-community/Llama-3.2-3B-Instruct-4bit',
          local_path: '/mock/adapters/llama-legal',
        },
      ]),
    })
  )

  // Engine chat (SSE stub)
  await page.route('**/api/engine/chat', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"text":"Hello "}\n\ndata: {"text":"world!"}\n\ndata: [DONE]\n\n',
      })
    }
    return route.continue()
  })

  // Engine chat stop
  await page.route('**/api/engine/chat/stop', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'stopped' }),
    })
  )

  // Deployment status
  await page.route('**/api/deployment/status', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ running: false, pid: null, uptime_seconds: null }),
    })
  )

  // Deployment logs
  await page.route('**/api/deployment/logs*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ logs: [] }),
    })
  )

  // RAG collections
  await page.route('**/api/rag/collections', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'col-1', name: 'Legal Docs', chunks: 1250, size: '12MB', lastUpdated: '2 hours ago', model: 'default' },
        ]),
      })
    }
    return route.continue()
  })

  // Agents — return one sample agent so the page has content
  await page.route('**/api/agents/', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'agent-1',
            name: 'Research Agent',
            nodes: [{ id: 'n1', type: 'llm', label: 'LLM' }],
            edges: [],
            config: {},
          },
        ]),
      })
    }
    // POST — save agent
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'agent-new',
          name: 'New Agent',
          nodes: [],
          edges: [],
          config: {},
        }),
      })
    }
    return route.continue()
  })

  // Agent delete
  await page.route('**/api/agents/*/execute', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        agent_id: 'agent-1',
        status: 'completed',
        execution_time: 1.5,
        steps: [],
      }),
    })
  )

  // Conversations
  await page.route('**/api/conversations/', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'conv-1',
            title: 'Test Conversation',
            model_id: 'test-model',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T01:00:00Z',
            message_count: 3,
            pinned: false,
          },
          {
            id: 'conv-2',
            title: 'Pinned Chat',
            model_id: 'test-model',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T02:00:00Z',
            message_count: 5,
            pinned: true,
          },
        ]),
      })
    }
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'conv-new',
          title: 'New conversation',
          messages: [],
          model_id: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          message_count: 0,
          pinned: false,
        }),
      })
    }
    return route.continue()
  })

  // Conversation by ID (for loading a conversation)
  await page.route('**/api/conversations/conv-*', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'conv-1',
          title: 'Test Conversation',
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
          ],
          model_id: 'test-model',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T01:00:00Z',
          message_count: 2,
          pinned: false,
        }),
      })
    }
    return route.continue()
  })

  // Conversations search
  await page.route('**/api/conversations/search', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  )

  // Notes
  await page.route('**/api/notes/', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'note-1',
            title: 'My First Note',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T01:00:00Z',
            pinned: false,
            char_count: 42,
          },
        ]),
      })
    }
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'note-new',
          title: 'Untitled',
          content: '',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          pinned: false,
          char_count: 0,
        }),
      })
    }
    return route.continue()
  })

  // Note by ID
  await page.route('**/api/notes/note-*', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'note-1',
          title: 'My First Note',
          content: '# Hello\nSome content here.',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T01:00:00Z',
          pinned: false,
          char_count: 42,
        }),
      })
    }
    if (route.request().method() === 'PATCH') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'note-1',
          title: 'My First Note',
          content: 'Updated',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T02:00:00Z',
          pinned: false,
          char_count: 7,
        }),
      })
    }
    return route.continue()
  })

  // MCP servers
  await page.route('**/api/mcp/servers', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    }
    return route.continue()
  })

  // Workspace tree
  await page.route('**/api/workspace/tree', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'project',
        path: '/mock/project',
        type: 'dir',
        children: [
          {
            name: 'src',
            path: '/mock/project/src',
            type: 'dir',
            children: [
              { name: 'main.py', path: '/mock/project/src/main.py', type: 'file' },
              { name: 'utils.ts', path: '/mock/project/src/utils.ts', type: 'file' },
            ],
          },
          { name: 'README.md', path: '/mock/project/README.md', type: 'file' },
        ],
      }),
    })
  )

  // Workspace read file
  await page.route('**/api/workspace/read', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: 'print("hello world")\n',
        language: 'python',
      }),
    })
  )

  // Workspace save file
  await page.route('**/api/workspace/save', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, bytes: 21 }),
    })
  )

  // Indexer sources
  await page.route('**/api/indexer/sources', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sources: [] }),
      })
    }
    return route.continue()
  })

  // Indexer status
  await page.route('**/api/indexer/status', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        running: false,
        last_run: null,
        collection_id: null,
        total_sources: 0,
        enabled_sources: 0,
      }),
    })
  )

  // Codebase status
  await page.route('**/api/codebase/status', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ indexed: false }),
    })
  )

  // Terminal exec/run (SSE stubs)
  await page.route('**/api/terminal/exec', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: 'data: {"type":"tool_output","data":{"output":"mock output","exit_code":0}}\n\ndata: {"type":"done","data":{}}\n\n',
    })
  )

  await page.route('**/api/terminal/run', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: 'data: {"type":"session_start","data":{"session_id":"s1"}}\n\ndata: {"type":"token_stream","data":{"text":"thinking..."}}\n\ndata: {"type":"done","data":{}}\n\n',
    })
  )

  // Search web (stub)
  await page.route('**/api/search/web', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [] }),
    })
  )

  // Engine finetune jobs
  await page.route('**/api/engine/finetune', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ job_id: 'job-1', status: 'starting', job_name: 'test-job' }),
    })
  )

  // Engine job status
  await page.route('**/api/engine/jobs/*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'not_found', progress: 0 }),
    })
  )
}

/** Click a sidebar navigation item by label text. */
export async function navigateTo(page: Page, label: string) {
  // SidebarItem uses <div role="button">, not <button>.
  // Try inside <nav> first (all items except Settings), then fall back to full page.
  const navBtn = page.locator(`nav >> role=button[name="${label}"]`)
  if (await navBtn.count() > 0) {
    await navBtn.click()
  } else {
    // Settings lives outside <nav>, at the bottom of the sidebar
    await page.locator(`role=button[name="${label}"]`).first().click()
  }
}
