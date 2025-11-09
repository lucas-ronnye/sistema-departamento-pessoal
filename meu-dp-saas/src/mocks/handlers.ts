import { rest } from 'msw'

export const handlers = [
  // Login handler: POST /api/login
  rest.post('/api/login', (req, res, ctx) => {
    const { username, password } = (req.body || {}) as {
      username?: string
      password?: string
    }

    if (username === 'admin' && password === '1234') {
      return res(ctx.status(200), ctx.json({ token: 'token-falso-123' }))
    }

    return res(
      ctx.status(401),
      ctx.json({ message: 'Unauthorized' })
    )
  }),

  // Me handler: GET /api/auth/me
  rest.get('/api/auth/me', (req, res, ctx) => {
    const auth = req.headers.get('Authorization')

    if (auth === 'Bearer token-falso-123') {
      return res(
        ctx.status(200),
        ctx.json({
          id: 1,
          nome: 'Admin SaaS',
          email: 'admin@meu-dp.com',
          permissoes: ['ver_colaboradores', 'editar_parametros', 'lider_equipe'],
        })
      )
    }

    return res(
      ctx.status(401),
      ctx.json({ message: 'Unauthorized' })
    )
  })
]

// ===== Fase 2: Módulos de Configuração =====
// Estado em memória para Clientes e Parâmetros
let clientes = [
  { id: 1, nome: 'Empresa Alpha Ltda', cnpj: '12.345.678/0001-90', status: 'Ativo', dominio: 'alpha.example.com' },
  { id: 2, nome: 'Beta Serviços ME', cnpj: '98.765.432/0001-10', status: 'Ativo', dominio: '' },
  { id: 3, nome: 'Gamma Comércio EIRELI', cnpj: '11.222.333/0001-44', status: 'Inativo', dominio: 'gamma.example.com' },
]

let inssData = [
  { key: 1, de: 0, ate: 1518.0, aliquota: 7.5, vigencia: '2025-01-01' },
  { key: 2, de: 1518.01, ate: 2793.88, aliquota: 9, vigencia: '2025-01-01' },
  { key: 3, de: 2793.89, ate: 4190.83, aliquota: 12, vigencia: '2025-01-01' },
  { key: 4, de: 4190.84, ate: 8157.41, aliquota: 14, vigencia: '2025-01-01' },
];

let irrfData = [
    { key: 1, de: 0, ate: 2428.80, aliquota: 0, deducao: 0, vigencia: '2025-05-01' },
    { key: 2, de: 2428.81, ate: 2826.65, aliquota: 7.5, deducao: 182.16, vigencia: '2025-05-01' },
    { key: 3, de: 2826.66, ate: 3751.05, aliquota: 15, deducao: 394.16, vigencia: '2025-05-01' },
    { key: 4, de: 3751.06, ate: 4664.68, aliquota: 22.5, deducao: 675.49, vigencia: '2025-05-01' },
    { key: 5, de: 4664.69, ate: null, aliquota: 27.5, deducao: 908.73, vigencia: '2025-05-01' },
];

let parametrosGerais = {
    salarioMinimo: 1518.00,
    tetoPrevidenciario: 8157.41,
    vigenciaGeral: '2025-01-01',
    aliquotaFgts: 8.0,
    autoINSS: false,
    autoIRRF: false,
    autoFGTS: false,
};

// ===== Impostos: DCTFWeb =====
// Estado em memória para simular o ciclo de apuração → consolidação → emissão de DARF → pagamento
type DctfwebState = {
  competencia: string
  status: 'Em Andamento' | 'Confessado' | 'Pago'
  valorDebito: number
  darfDisponivel: boolean
  darfLinhaDigitavel: string
}

let dctfweb: DctfwebState = {
  competencia: '2025-10',
  status: 'Em Andamento',
  valorDebito: 4500.75,
  darfDisponivel: false,
  darfLinhaDigitavel: ''
}

// ===== Impostos: FGTS Digital =====
// Estado em memória para simular emissão da GRFGTS e pagamento
type FgtsDigitalState = {
  competencia: string
  status: 'Aguardando' | 'Guia Gerada' | 'Pago'
  valorGuia: number
  guiaDisponivel: boolean
  linhaDigitavel?: string
}

let fgtsDigital: FgtsDigitalState = {
  competencia: '2025-10',
  status: 'Aguardando',
  valorGuia: 1088.04,
  guiaDisponivel: false,
  linhaDigitavel: ''
}

type FgtsHistoricoItem = {
  competencia: string
  status: 'Aguardando' | 'Guia Gerada' | 'Pago'
  valorGuia: number
  linhaDigitavel?: string
}

let fgtsHistorico: FgtsHistoricoItem[] = [
  { competencia: fgtsDigital.competencia, status: fgtsDigital.status, valorGuia: fgtsDigital.valorGuia, linhaDigitavel: fgtsDigital.linhaDigitavel }
]


handlers.push(
  // Clientes: GET lista
  rest.get('/api/clientes', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(clientes))
  }),

  // Clientes: POST (criar)
  rest.post('/api/clientes', async (req, res, ctx) => {
    const body = (await req.json()) as { nome: string; cnpj: string; status?: string; dominio?: string }
    const newId = clientes.length ? Math.max(...clientes.map((c) => c.id)) + 1 : 1
    const novo = { id: newId, nome: body.nome, cnpj: body.cnpj, status: body.status || 'Ativo', dominio: body.dominio || '' }
    clientes.push(novo)
    return res(ctx.status(201), ctx.json(novo))
  }),
  
  // Clientes: PUT (atualizar domínio/status)
  rest.put('/api/clientes/:id', async (req, res, ctx) => {
    const { id } = req.params
    const numId = Number(id)
    const body = (await req.json()) as Partial<{ nome: string; cnpj: string; status: string; dominio: string }>
    const idx = clientes.findIndex((c) => c.id === numId)
    if (idx === -1) return res(ctx.status(404), ctx.json({ message: 'Not found' }))
    clientes[idx] = { ...clientes[idx], ...body }
    return res(ctx.status(200), ctx.json(clientes[idx]))
  }),

  // --- PARÂMETROS ---
  // INSS
  rest.get('/api/parametros/inss', (_req, res, ctx) => res(ctx.status(200), ctx.json(inssData))),
  rest.post('/api/parametros/inss', async (req, res, ctx) => {
    const body = await req.json();
    const newKey = inssData.length > 0 ? Math.max(...inssData.map(i => Number(i.key))) + 1 : 1;
    const newItem = { ...body, key: newKey };
    inssData.push(newItem);
    return res(ctx.status(201), ctx.json(newItem));
  }),
  rest.put('/api/parametros/inss/:key', async (req, res, ctx) => {
    const { key } = req.params;
    const body = await req.json();
    inssData = inssData.map(item => item.key === Number(key) ? { ...body, key: Number(key) } : item);
    return res(ctx.status(200), ctx.json(body));
  }),
  rest.delete('/api/parametros/inss/:key', (req, res, ctx) => {
    const { key } = req.params;
    inssData = inssData.filter(item => item.key !== Number(key));
    return res(ctx.status(204));
  }),

  // IRRF
  rest.get('/api/parametros/irrf', (_req, res, ctx) => res(ctx.status(200), ctx.json(irrfData))),
  rest.post('/api/parametros/irrf', async (req, res, ctx) => {
    const body = await req.json();
    const newKey = irrfData.length > 0 ? Math.max(...irrfData.map(i => Number(i.key))) + 1 : 1;
    const newItem = { ...body, key: newKey };
    irrfData.push(newItem);
    return res(ctx.status(201), ctx.json(newItem));
  }),
  rest.put('/api/parametros/irrf/:key', async (req, res, ctx) => {
    const { key } = req.params;
    const body = await req.json();
    irrfData = irrfData.map(item => item.key === Number(key) ? { ...body, key: Number(key) } : item);
    return res(ctx.status(200), ctx.json(body));
  }),
  rest.delete('/api/parametros/irrf/:key', (req, res, ctx) => {
    const { key } = req.params;
    irrfData = irrfData.filter(item => item.key !== Number(key));
    return res(ctx.status(204));
  }),

  // Geral
  rest.get('/api/parametros/geral', (_req, res, ctx) => res(ctx.status(200), ctx.json(parametrosGerais))),
  rest.post('/api/parametros/geral', async (req, res, ctx) => {
    const body = await req.json();
    parametrosGerais = { ...parametrosGerais, ...body };
    return res(ctx.status(200), ctx.json(parametrosGerais));
  })
)

// --- Parâmetros: Fonte Oficial (Gov.br) ---
handlers.push(
  // INSS oficial: retorna faixas com metadados de fonte
  rest.get('/api/parametros/oficial/inss', (_req, res, ctx) => {
    const fonte = {
      nome: 'Gov.br – INSS',
      url: 'https://www.gov.br/inss/pt-br/assuntos/beneficios/valores-de-contribuicao',
      vigencia: '2025-01-01',
      observacao: 'Faixas conforme Portaria Interministerial MPS/MF nº 6 (13/01/2025) e tabela vigente 2025.'
    };
    const faixasOficiais2025 = [
      { key: 1, de: 0, ate: 1518.0, aliquota: 7.5, vigencia: '2025-01-01' },
      { key: 2, de: 1518.01, ate: 2793.88, aliquota: 9, vigencia: '2025-01-01' },
      { key: 3, de: 2793.89, ate: 4190.83, aliquota: 12, vigencia: '2025-01-01' },
      { key: 4, de: 4190.84, ate: 8157.41, aliquota: 14, vigencia: '2025-01-01' },
    ];
    return res(ctx.status(200), ctx.json({ fonte, faixas: faixasOficiais2025 }));
  }),
  // IRRF oficial: retorna faixas com metadados de fonte
  rest.get('/api/parametros/oficial/irrf', (_req, res, ctx) => {
    const fonte = {
      nome: 'Receita Federal – IRPF',
      url: 'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas',
      vigencia: '2025-05-01',
      observacao: 'Tabela progressiva mensal vigente a partir de maio/2025; até abril/2025 vigia a tabela anterior.'
    };
    const faixas2025Maio = [
      { key: 1, de: 0, ate: 2428.80, aliquota: 0, deducao: 0, vigencia: '2025-05-01' },
      { key: 2, de: 2428.81, ate: 2826.65, aliquota: 7.5, deducao: 182.16, vigencia: '2025-05-01' },
      { key: 3, de: 2826.66, ate: 3751.05, aliquota: 15, deducao: 394.16, vigencia: '2025-05-01' },
      { key: 4, de: 3751.06, ate: 4664.68, aliquota: 22.5, deducao: 675.49, vigencia: '2025-05-01' },
      { key: 5, de: 4664.69, ate: null, aliquota: 27.5, deducao: 908.73, vigencia: '2025-05-01' },
    ];
    return res(ctx.status(200), ctx.json({ fonte, faixas: faixas2025Maio }));
  }),
  // FGTS oficial: retorna alíquotas padrão
  rest.get('/api/parametros/oficial/fgts', (_req, res, ctx) => {
    const fonte = {
      nome: 'Gov.br – FGTS Digital',
      url: 'https://www.gov.br/trabalho-e-emprego/pt-br/servicos/fgts',
      vigencia: parametrosGerais.vigenciaGeral,
      observacao: 'Alíquota padrão de 8% para empregados (Lei 8.036/1990).'
    };
    return res(ctx.status(200), ctx.json({ fonte, aliquotaPadrao: 8.0 }));
  }),
  // Operação de substituição em massa (bulk) de INSS
  rest.post('/api/parametros/inss/bulk', async (req, res, ctx) => {
    const body = await req.json();
    const faixas = (body?.faixas || []) as typeof inssData;
    // Reatribui keys sequenciais
    inssData = faixas.map((f, idx) => ({ ...f, key: idx + 1 }));
    return res(ctx.status(200), ctx.json({ success: true, count: inssData.length }));
  }),
  // Operação de substituição em massa (bulk) de IRRF
  rest.post('/api/parametros/irrf/bulk', async (req, res, ctx) => {
    const body = await req.json();
    const faixas = (body?.faixas || []) as typeof irrfData;
    irrfData = faixas.map((f, idx) => ({ ...f, key: idx + 1 }));
    return res(ctx.status(200), ctx.json({ success: true, count: irrfData.length }));
  }),
)


// ===== Fase 4: Operação (Ponto e Escalas) =====
type Jornada = {
  key: React.Key;
  descricao: string;
  entrada: string;
  saida: string;
  intervalo?: [string, string];
}
type Escala = {
  key: React.Key;
  descricao: string;
  tipo: 'dias' | 'horas';
}
type PontoDia = {
  key: React.Key;
  colaboradorId: number;
  mes: string; // YYYY-MM
  dia: string; // DD/MM/YYYY (Dia da semana)
  marcacoes: string[]; // Array de strings "HH:mm"
  horasTrabalhadas: string;
  saldoDia: string;
}

let jornadas: Jornada[] = [
  { key: 1, descricao: 'Turno Manhã (8h-12h)', entrada: '08:00', saida: '12:00' },
  { key: 2, descricao: 'Turno Tarde (13h-18h)', entrada: '13:00', saida: '18:00' },
  { key: 3, descricao: 'Comercial (8h-18h)', entrada: '08:00', saida: '18:00', intervalo: ['12:00', '13:00'] },
]
let escalas: Escala[] = [
  { key: 1, descricao: '5x2 - Semana Comercial', tipo: 'dias' },
  { key: 2, descricao: '6x1 - Seis por Um', tipo: 'dias' },
  { key: 3, descricao: '12x36 - Plantonista', tipo: 'horas' },
];
const gradeDias: Record<string, string | null> = {
  '2025-11-03': 'Comercial (8h-18h)',
  '2025-11-04': 'Comercial (8h-18h)',
  '2025-11-05': 'Folga',
};
let apuracaoData: PontoDia[] = [
  { key: 1, colaboradorId: 1, mes: '2025-11', dia: '01/11/2025 (Sáb)', marcacoes: ['08:01', '12:02', '13:00', '18:05'], horasTrabalhadas: '09:06', saldoDia: '+01:06' },
  { key: 2, colaboradorId: 1, mes: '2025-11', dia: '02/11/2025 (Dom)', marcacoes: [], horasTrabalhadas: '00:00', saldoDia: '00:00' },
  { key: 3, colaboradorId: 1, mes: '2025-11', dia: '03/11/2025 (Seg)', marcacoes: ['07:55', '12:00', '12:58', '17:59'], horasTrabalhadas: '08:06', saldoDia: '+00:06' },
  { key: 4, colaboradorId: 2, mes: '2025-11', dia: '03/11/2025 (Seg)', marcacoes: ['08:00', '12:00', '13:00', '17:00'], horasTrabalhadas: '08:00', saldoDia: '00:00' },
];


handlers.push(
  // Jornadas: GET lista
  rest.get('/api/jornadas', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(jornadas))
  }),

  // Jornadas: POST (criar)
  rest.post('/api/jornadas', async (req, res, ctx) => {
    const body = (await req.json()) as Omit<Jornada, 'key'>
    const newKey = jornadas.length ? Math.max(...jornadas.map((j) => Number(j.key))) + 1 : 1
    const nova: Jornada = { key: newKey, ...body }
    jornadas.push(nova)
    return res(ctx.status(201), ctx.json(nova))
  }),

  // Jornadas: PUT (atualizar)
  rest.put('/api/jornadas/:key', async (req, res, ctx) => {
    const { key } = req.params
    const numKey = Number(key)
    const body = (await req.json()) as Omit<Jornada, 'key'>
    const idx = jornadas.findIndex((j) => j.key === numKey)
    if (idx === -1) return res(ctx.status(404), ctx.json({ message: 'Not found' }))
    jornadas[idx] = { key: numKey, ...body }
    return res(ctx.status(200), ctx.json(jornadas[idx]))
  }),

  // Jornadas: DELETE (remover)
  rest.delete('/api/jornadas/:key', (req, res, ctx) => {
    const { key } = req.params
    const numKey = Number(key)
    jornadas = jornadas.filter((j) => j.key !== numKey)
    return res(ctx.status(204))
  }),

  // Escalas: GET lista
  rest.get('/api/ponto/escalas', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(escalas))
  }),

  // Escalas: POST (criar)
  rest.post('/api/ponto/escalas', async (req, res, ctx) => {
    const body = (await req.json()) as Omit<Escala, 'key'>;
    const newKey = escalas.length ? Math.max(...escalas.map(e => Number(e.key))) + 1 : 1;
    const nova: Escala = { key: newKey, ...body };
    escalas.push(nova);
    return res(ctx.status(201), ctx.json(nova));
  }),

  // Escalas: PUT (atualizar)
  rest.put('/api/ponto/escalas/:key', async (req, res, ctx) => {
    const { key } = req.params;
    const numKey = Number(key);
    const body = (await req.json()) as Omit<Escala, 'key'>;
    const idx = escalas.findIndex(e => e.key === numKey);
    if (idx === -1) return res(ctx.status(404), ctx.json({ message: 'Not found' }));
    escalas[idx] = { key: numKey, ...body };
    return res(ctx.status(200), ctx.json(escalas[idx]));
  }),

  // Escalas: DELETE (remover)
  rest.delete('/api/ponto/escalas/:key', (req, res, ctx) => {
    const { key } = req.params;
    const numKey = Number(key);
    escalas = escalas.filter(e => e.key !== numKey);
    return res(ctx.status(204));
  }),

  // Grade de ponto: GET /api/ponto/grade
  rest.get('/api/ponto/grade', (req, res, ctx) => {
    const mes = req.url.searchParams.get('mes') || '2025-11'
    return res(ctx.status(200), ctx.json({ mes, dias: gradeDias }))
  }),

  // Grade de ponto: POST /api/ponto/grade (atribuir jornada)
  rest.post('/api/ponto/grade', async (req, res, ctx) => {
    const { dateKey, jornadaNome } = (await req.json()) as { dateKey: string, jornadaNome: string };
    gradeDias[dateKey] = jornadaNome;
    return res(ctx.status(200), ctx.json({ success: true }));
  }),

  // Apuração de Ponto: GET
  rest.get('/api/ponto/apuracao', (req, res, ctx) => {
    const colaboradorId = Number(req.url.searchParams.get('colaboradorId'))
    const mes = req.url.searchParams.get('mes') // YYYY-MM
    if (!colaboradorId || !mes) {
      return res(ctx.status(400), ctx.json({ message: 'colaboradorId e mes são obrigatórios.' }))
    }

    // @ts-ignore
    const store = (globalThis.__marcacoesPonto || []) as Array<{
      id: number
      colaboradorId: number
      data: string // YYYY-MM-DD
      hora: string // HH:mm:ss
      tipo: 'Entrada' | 'Saída' | 'Início Intervalo' | 'Fim Intervalo'
      lat?: number
      lon?: number
      observacao?: string
    }>

    // Agrupa por dia, apenas do colaborador e mês informado
    const porDia: Record<string, typeof store> = {}
    store
      .filter((m) => m.colaboradorId === colaboradorId && m.data.startsWith(mes))
      .sort((a, b) => (a.data === b.data ? a.hora.localeCompare(b.hora) : a.data.localeCompare(b.data)))
      .forEach((m) => {
        porDia[m.data] = porDia[m.data] || []
        porDia[m.data].push(m)
      })

    const diaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const toMin = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map(Number)
      return h * 60 + m
    }
    const fmt = (min: number) => {
      const h = Math.floor(Math.abs(min) / 60)
      const m = Math.abs(min) % 60
      return `${min < 0 ? '-' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }

    const resultado = Object.keys(porDia).map((dataKey, idx) => {
      const marks = porDia[dataKey]
      // Calcula horas trabalhadas considerando intervalos
      let trabalhandoDesde: string | null = null
      let totalMin = 0
      let emIntervalo = false

      marks.forEach((m) => {
        const hhmm = m.hora.slice(0, 5)
        if (m.tipo === 'Entrada' && !trabalhandoDesde && !emIntervalo) {
          trabalhandoDesde = hhmm
        } else if (m.tipo === 'Início Intervalo' && trabalhandoDesde && !emIntervalo) {
          // soma até início do intervalo
          totalMin += toMin(hhmm) - toMin(trabalhandoDesde)
          trabalhandoDesde = null
          emIntervalo = true
          // início do intervalo
        } else if (m.tipo === 'Fim Intervalo' && emIntervalo) {
          // volta a trabalhar após fim do intervalo
          emIntervalo = false
          trabalhandoDesde = hhmm
          // fim do intervalo
        } else if (m.tipo === 'Saída' && trabalhandoDesde) {
          totalMin += toMin(hhmm) - toMin(trabalhandoDesde)
          trabalhandoDesde = null
        }
      })

      // Horas esperadas do dia: usa cargaHorariaDia do colaborador, 0 se folga
      const esperadaMin = (() => {
        const grade = gradeDias[dataKey]
        if (!grade || grade === 'Folga') return 0
        const colab = colaboradores.find((c) => c.id === colaboradorId)
        const cargaHoras = colab?.cargaHorariaDia ?? 8
        return Math.max(0, Math.min(24, cargaHoras)) * 60
      })()

      const saldoMin = totalMin - esperadaMin
      const d = new Date(dataKey)
      const labelDia = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} (${diaSemana[d.getDay()]})`

      return {
        key: `${dataKey}-${idx}`,
        colaboradorId,
        mes,
        dia: labelDia,
        marcacoes: marks.map((m) => m.hora.slice(0, 5)),
        horasTrabalhadas: fmt(totalMin),
        saldoDia: (saldoMin === 0 ? '00:00' : (saldoMin > 0 ? `+${fmt(saldoMin)}` : fmt(saldoMin))),
      }
    })

    // Se não houver batidas, retorna vazio (ou fallback dos mocks estáticos)
    return res(ctx.status(200), ctx.json(resultado.length ? resultado : []))
  }),

  // Apuração de Ponto: POST (ajuste)
  rest.post('/api/ponto/ajuste', async (req, res, ctx) => {
    const body = await req.json();
    console.log('Ajuste de ponto recebido:', body);
    // Aqui você implementaria a lógica para aplicar o ajuste
    return res(ctx.status(200), ctx.json({ success: true, message: 'Ajuste aplicado com sucesso.' }));
  })
)

// ===== Fase 3: CRUD Central (Colaboradores) =====
type Colaborador = {
  id: number;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  unidade: string;
  // Referência ao local de trabalho (Onsite/Remoto/Híbrido)
  localTrabalhoId?: number;
  status: 'ativo' | 'inativo';
  // Carga horária diária esperada em horas (ex.: 8, 12)
  cargaHorariaDia?: number;
  // Referência à escala escolhida pelo gestor
  escalaKey?: number;
}
type Dependente = {
  id: number;
  colaboradorId: number;
  nome: string;
  parentesco: string;
  dataNascimento: string;
}

let colaboradores: Colaborador[] = [
  { id: 1, nome: 'Ana Souza', cpf: '123.456.789-00', cargo: 'Analista DP', salario: 4200, unidade: 'Escritório Paulista', localTrabalhoId: 1, status: 'ativo', cargaHorariaDia: 8, escalaKey: 1 },
  { id: 2, nome: 'Bruno Lima', cpf: '987.654.321-00', cargo: 'Assistente RH', salario: 3200, unidade: 'Hub Campinas', localTrabalhoId: 3, status: 'ativo', cargaHorariaDia: 8, escalaKey: 2 },
  { id: 3, nome: 'Carla Mendes', cpf: '111.222.333-44', cargo: 'Coordenador DP', salario: 6200, unidade: 'Home Office Brasil', localTrabalhoId: 2, status: 'inativo', cargaHorariaDia: 8, escalaKey: 1 },
]
let dependentes: Dependente[] = [
  { id: 1, colaboradorId: 1, nome: 'Pedro Souza', parentesco: 'Filho(a)', dataNascimento: '2015-03-10' },
  { id: 2, colaboradorId: 1, nome: 'Mariana Souza', parentesco: 'Cônjuge', dataNascimento: '1990-05-20' },
];

handlers.push(
  // Colaboradores: GET lista
  rest.get('/api/colaboradores', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(colaboradores))
  }),

  // Colaboradores: GET por ID
  rest.get('/api/colaboradores/:id', (req, res, ctx) => {
    const { id } = req.params
    const numId = Number(id)
    const found = colaboradores.find((c) => c.id === numId)
    if (!found) return res(ctx.status(404), ctx.json({ message: 'Not found' }))
    return res(ctx.status(200), ctx.json(found))
  }),

  // Colaboradores: POST (criar)
  rest.post('/api/colaboradores', async (req, res, ctx) => {
    const body = (await req.json()) as Omit<Colaborador, 'id'>
    const auth = req.headers.get('Authorization') || ''
    const hasLiderPerm = auth === 'Bearer token-falso-123'
    if (!hasLiderPerm && body?.escalaKey != null) {
      return res(ctx.status(403), ctx.json({ message: 'Apenas líder de equipe pode definir a escala do colaborador.' }))
    }
    const newId = colaboradores.length ? Math.max(...colaboradores.map((c) => c.id)) + 1 : 1
    // Deriva unidade a partir do localTrabalhoId, quando disponível
    const unidadeDerivada = (() => {
      if (body.localTrabalhoId != null) {
        const local = locaisTrabalho.find(l => l.id === body.localTrabalhoId)
        return local?.nome || 'Matriz'
      }
      return body.unidade || 'Matriz'
    })()
    const novo: Colaborador = {
      id: newId,
      ...body,
      status: body.status ?? 'ativo',
      unidade: unidadeDerivada,
      cargaHorariaDia: body.cargaHorariaDia ?? 8,
      escalaKey: body.escalaKey ?? undefined,
    }
    colaboradores.push(novo)
    return res(ctx.status(201), ctx.json(novo))
  }),

  // Colaboradores: PUT (atualizar)
  rest.put('/api/colaboradores/:id', async (req, res, ctx) => {
    const { id } = req.params
    const numId = Number(id)
    const body = (await req.json()) as Omit<Colaborador, 'id'>
    const idx = colaboradores.findIndex((c) => c.id === numId)
    if (idx === -1) return res(ctx.status(404), ctx.json({ message: 'Not found' }))
    const auth = req.headers.get('Authorization') || ''
    const hasLiderPerm = auth === 'Bearer token-falso-123'
    const isChangingEscala = ('escalaKey' in body) && body.escalaKey !== colaboradores[idx].escalaKey
    if (!hasLiderPerm && isChangingEscala) {
      return res(ctx.status(403), ctx.json({ message: 'Apenas líder de equipe pode alterar a escala do colaborador.' }))
    }
    // Se mudou localTrabalhoId, atualiza unidade derivada
    let unidade = colaboradores[idx].unidade
    if (body.localTrabalhoId != null) {
      const local = locaisTrabalho.find(l => l.id === body.localTrabalhoId)
      unidade = local?.nome || unidade
    } else if (body.unidade) {
      unidade = body.unidade
    }

    colaboradores[idx] = {
      ...colaboradores[idx],
      ...body,
      id: numId,
      unidade,
      cargaHorariaDia: body.cargaHorariaDia ?? colaboradores[idx].cargaHorariaDia ?? 8,
      escalaKey: body.escalaKey ?? colaboradores[idx].escalaKey,
    }
    return res(ctx.status(200), ctx.json(colaboradores[idx]))
  }),

  // Colaboradores: DELETE (remover)
  rest.delete('/api/colaboradores/:id', (req, res, ctx) => {
    const { id } = req.params
    const numId = Number(id)
    colaboradores = colaboradores.filter((c) => c.id !== numId)
    // Also delete dependents
    dependentes = dependentes.filter(d => d.colaboradorId !== numId);
    return res(ctx.status(204))
  }),

  // Dependentes: GET por Colaborador ID
  rest.get('/api/colaboradores/:id/dependentes', (req, res, ctx) => {
    const { id } = req.params;
    const numId = Number(id);
    const deps = dependentes.filter(d => d.colaboradorId === numId);
    return res(ctx.status(200), ctx.json(deps));
  }),

  // Dependentes: POST (criar)
  rest.post('/api/colaboradores/:id/dependentes', async (req, res, ctx) => {
    const { id } = req.params;
    const body = (await req.json()) as Omit<Dependente, 'id' | 'colaboradorId'>;
    const newId = dependentes.length ? Math.max(...dependentes.map(d => d.id)) + 1 : 1;
    const novo: Dependente = { ...body, id: newId, colaboradorId: Number(id) };
    dependentes.push(novo);
    return res(ctx.status(201), ctx.json(novo));
  }),

  // Dependentes: PUT (atualizar)
  rest.put('/api/dependentes/:dependenteId', async (req, res, ctx) => {
    const { dependenteId } = req.params;
    const numId = Number(dependenteId);
    const body = (await req.json()) as Omit<Dependente, 'id'>;
    const idx = dependentes.findIndex(d => d.id === numId);
    if (idx === -1) return res(ctx.status(404), ctx.json({ message: 'Not found' }));
    dependentes[idx] = { ...dependentes[idx], ...body, id: numId };
    return res(ctx.status(200), ctx.json(dependentes[idx]));
  }),

  // Dependentes: DELETE (remover)
  rest.delete('/api/dependentes/:dependenteId', (req, res, ctx) => {
    const { dependenteId } = req.params;
    const numId = Number(dependenteId);
    dependentes = dependentes.filter(d => d.id !== numId);
    return res(ctx.status(204));
  })
)

// ===== Fase 5: PWA (Portal do Colaborador) =====
handlers.push(
  // Bater ponto: apenas confirma
  // Estado em memória para marcações de ponto
  rest.post('/api/ponto/bater', async (req, res, ctx) => {
    type Marcacao = {
      id: number
      colaboradorId: number
      data: string // YYYY-MM-DD
      hora: string // HH:mm:ss
      tipo: 'Entrada' | 'Saída' | 'Início Intervalo' | 'Fim Intervalo'
      lat?: number
      lon?: number
      observacao?: string
    }

    // inicializa armazenamento global simples
    // @ts-ignore
    if (!globalThis.__marcacoesPonto) {
      // @ts-ignore
      globalThis.__marcacoesPonto = [] as Marcacao[]
      // @ts-ignore
      globalThis.__marcacaoSeq = 1 as number
    }

    const body = (await req.json().catch(() => ({}))) as {
      colaboradorId?: number
      lat?: number
      lon?: number
      data?: string // ISO
      tipo?: Marcacao['tipo']
      observacao?: string
    }
    const now = body?.data ? new Date(body.data) : new Date()
    const dataStr = `${now.getFullYear().toString().padStart(4, '0')}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`
    const horaStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

    // @ts-ignore
    const id = globalThis.__marcacaoSeq++ as number
    const tipo = body?.tipo || 'Entrada'
    // valida sequência
    // @ts-ignore
    const storeHoje = (globalThis.__marcacoesPonto || []).filter((m: Marcacao) => m.data === dataStr) as Marcacao[]
    const last = storeHoje[storeHoje.length - 1]
    const allowedNext = (() => {
      if (!last) return ['Entrada']
      switch (last.tipo) {
        case 'Entrada':
          return ['Início Intervalo', 'Saída']
        case 'Início Intervalo':
          return ['Fim Intervalo']
        case 'Fim Intervalo':
          return ['Saída']
        case 'Saída':
          return ['Entrada']
        default:
          return ['Entrada']
      }
    })()
    if (!allowedNext.includes(tipo)) {
      return res(
        ctx.status(400),
        ctx.json({ message: `Sequência inválida. Próximos permitidos: ${allowedNext.join(', ')}` })
      )
    }

    const nova: Marcacao = {
      id,
      colaboradorId: body?.colaboradorId || 1,
      data: dataStr,
      hora: horaStr,
      tipo,
      lat: body?.lat,
      lon: body?.lon,
      observacao: body?.observacao,
    }
    // @ts-ignore
    globalThis.__marcacoesPonto.push(nova)
    return res(ctx.status(200), ctx.json({ success: true, marcacao: nova }))
  }),

  // Listar marcações do dia
  rest.get('/api/ponto/marcacoes', async (req, res, ctx) => {
    // @ts-ignore
    const store = (globalThis.__marcacoesPonto || []) as any[]
    const dataParam = req.url.searchParams.get('data')
    const colaboradorParam = req.url.searchParams.get('colaboradorId')
    let lista = dataParam ? store.filter((m) => m.data === dataParam) : store
    if (colaboradorParam) {
      const colId = Number(colaboradorParam)
      lista = lista.filter((m) => m.colaboradorId === colId)
    }
    return res(ctx.status(200), ctx.json(lista))
  }),

  // Holerites: lista de meses disponíveis
  rest.get('/api/holerites', (_req, res, ctx) => {
    const meses = [
      { id: 1, mes: 'Outubro/2025' },
      { id: 2, mes: 'Setembro/2025' },
      { id: 3, mes: 'Agosto/2025' },
    ]
    return res(ctx.status(200), ctx.json(meses))
  })
)

// ===== Fase 6: Saídas (Folha, eSocial, Relatórios) =====

handlers.push(

  // Folha: processar cálculo da competência

  rest.post('/api/folha/calcular', async (req, res, ctx) => {

    const body = (await req.json().catch(() => ({}))) as { competencia?: string }

    const competencia = body?.competencia || '2025-01'

    

    const teto = Number(parametrosGerais?.tetoPrevidenciario || 0) || 0;
    const fgtsAliquota = Number(parametrosGerais?.aliquotaFgts || 8.0);

    const calcINSSProgressivo = (salario: number) => {
      const base = teto > 0 ? Math.min(salario, teto) : salario;
      let total = 0;
      const faixasOrdenadas = [...inssData].sort((a, b) => Number(a.de) - Number(b.de));
      for (const f of faixasOrdenadas) {
        const inicio = Number(f.de);
        const fimFaixa = f.ate == null ? base : Math.min(Number(f.ate), base);
        if (base <= inicio) continue;
        const segmento = Math.max(0, fimFaixa - inicio);
        if (segmento > 0) total += segmento * (Number(f.aliquota) / 100);
      }
      return Number(total.toFixed(2));
    };

    const calcIRRF = (base: number) => {
      if (base <= 0) return 0;
      const faixa = [...irrfData]
        .sort((a, b) => Number(a.de) - Number(b.de))
        .find((f) => base >= Number(f.de) && (f.ate == null || base <= Number(f.ate)));
      if (!faixa) return 0;
      const aliquota = Number(faixa.aliquota) / 100;
      const deducao = Number((faixa as any).deducao || 0);
      const imposto = base * aliquota - deducao;
      return Number(Math.max(0, imposto).toFixed(2));
    };

    const resultados = colaboradores
      .filter((c) => c.status === 'ativo')
      .map((c) => {
        const salarioBruto = Number(c.salario || 0);
        const inss = calcINSSProgressivo(salarioBruto);
        const baseIrrf = Math.max(0, salarioBruto - inss);
        const irrf = calcIRRF(baseIrrf);
        const descontos = Number((inss + irrf).toFixed(2));
        const salarioLiquido = Number((salarioBruto - descontos).toFixed(2));
        const fgtsMes = Number((salarioBruto * (fgtsAliquota / 100)).toFixed(2));
        return {
          key: c.id,
          colaborador: c.nome,
          salarioBruto,
          descontos,
          salarioLiquido,
          status: 'calculado' as const,
          baseInss: Number((teto > 0 ? Math.min(salarioBruto, teto) : salarioBruto).toFixed(2)),
          baseIrrf,
          baseFgts: salarioBruto,
          fgtsMes,
        };
      });



    return res(

      ctx.status(200),

      ctx.json({ success: true, competencia, resultados })

    )

  }),



  // Folha: recibos por competência

  rest.get('/api/folha/recibos', (req, res, ctx) => {

    const mes = req.url.searchParams.get('mes') || '2025-10'

    const recibos = [

      { id: 1, colaborador: 'Ana Souza', cargo: 'Analista', competencia: mes, liquido: 5200.75, status: 'Disponível' },

      { id: 2, colaborador: 'Bruno Lima', cargo: 'Operador', competencia: mes, liquido: 3200.0, status: 'Disponível' },

      { id: 3, colaborador: 'Carla Mendes', cargo: 'Coordenador', competencia: mes, liquido: 7300.9, status: 'Bloqueado' },

    ]

    return res(ctx.status(200), ctx.json(recibos))

  }),



  // eSocial: lista de eventos

  rest.get('/api/esocial/eventos', (_req, res, ctx) => {

    const eventos = [

      { id: 101, tipo: 'S-1000', descricao: 'Informações do Empregador', status: 'Pendente', data: '2025-10-01' },

      { id: 102, tipo: 'S-2200', descricao: 'Cadastramento de Trabalhador', status: 'Enviado', data: '2025-10-03' },

      { id: 103, tipo: 'S-1200', descricao: 'Remuneração de Trabalhador', status: 'Pendente', data: '2025-10-05' },

    ]

    return res(ctx.status(200), ctx.json(eventos))

  }),



  // Relatórios: POST para gerar

  rest.post('/api/relatorios/:tipo', async (req, res, ctx) => {

    const { tipo } = req.params;

    const filtros = await req.json();

    console.log(`Gerando relatório do tipo '${tipo}' com filtros:`, filtros);

    // Simula a geração de um arquivo

    await new Promise(resolve => setTimeout(resolve, 1500));

    return res(ctx.status(200), ctx.json({

      message: 'Relatório gerado com sucesso!',

      fileUrl: `/downloads/relatorio-${tipo}-${Date.now()}.pdf`

    }));

  }),



  // DCTFWeb: endpoints (usa estado em memória acima)
  // GET status (aceita query param competencia=YYYY-MM para ajustar período)
  rest.get('/api/impostos/dctfweb', (req, res, ctx) => {
    const competenciaParam = req.url.searchParams.get('competencia')
    if (competenciaParam) {
      // muda apenas a competência; valores são mantidos como exemplo
      dctfweb.competencia = competenciaParam
    }
    return res(ctx.status(200), ctx.json(dctfweb))
  }),

  // POST consolidar: torna a apuração "Confessado" e disponibiliza o DARF
  rest.post('/api/impostos/dctfweb/consolidar', async (req, res, ctx) => {
    const body = await req.json().catch(() => ({})) as { competencia?: string }
    if (body?.competencia) dctfweb.competencia = body.competencia
    dctfweb.status = 'Confessado'
    dctfweb.darfDisponivel = true
    // gera uma linha digitável fictícia
    const rand = Math.floor(10000000000000 + Math.random() * 90000000000000).toString()
    dctfweb.darfLinhaDigitavel = `8486.${rand.slice(0,5)} ${rand.slice(5,10)}.${rand.slice(10,15)} ${rand.slice(0,5)} ${rand.slice(5,17)}`
    return res(ctx.status(200), ctx.json(dctfweb))
  }),

  // POST emitir-darf: retorna informações da guia (não altera estado além do que já está consolidado)
  rest.post('/api/impostos/dctfweb/emitir-darf', (_req, res, ctx) => {
    if (!dctfweb.darfDisponivel) {
      return res(ctx.status(400), ctx.json({ message: 'DARF indisponível. Consolide a DCTFWeb primeiro.' }))
    }
    const guia = {
      competencia: dctfweb.competencia,
      valor: dctfweb.valorDebito,
      codigoReceita: '5976',
      linhaDigitavel: dctfweb.darfLinhaDigitavel,
    }
    return res(ctx.status(200), ctx.json(guia))
  }),

  // POST marcar-pago: atualiza o status para "Pago"
  rest.post('/api/impostos/dctfweb/marcar-pago', (_req, res, ctx) => {
    if (!dctfweb.darfDisponivel) {
      return res(ctx.status(400), ctx.json({ message: 'Não é possível marcar como pago sem guia disponível.' }))
    }
    dctfweb.status = 'Pago'
    return res(ctx.status(200), ctx.json(dctfweb))
  }),



  // FGTS Digital: GET status (aceita query competencia=YYYY-MM)
  rest.get('/api/impostos/fgts-digital', (req, res, ctx) => {
    const competenciaParam = req.url.searchParams.get('competencia')
    if (competenciaParam) {
      fgtsDigital.competencia = competenciaParam
    }
    return res(ctx.status(200), ctx.json(fgtsDigital))
  }),

  // FGTS Digital: POST emitir guia (gera linha digitável e marca disponível)
  rest.post('/api/impostos/fgts-digital/emitir-guia', async (req, res, ctx) => {
    const body = await req.json().catch(() => ({})) as { competencia?: string }
    if (body?.competencia) fgtsDigital.competencia = body.competencia
    // calcula a soma do FGTS do mês com base na alíquota geral e salários
    const fgtsAliquota = Number(parametrosGerais?.aliquotaFgts || 8.0)
    const totalFgts = colaboradores
      .filter((c) => c.status === 'ativo')
      .reduce((acc, c) => acc + Number(c.salario || 0) * (fgtsAliquota / 100), 0)
    fgtsDigital.valorGuia = Number(totalFgts.toFixed(2))
    fgtsDigital.status = 'Guia Gerada'
    fgtsDigital.guiaDisponivel = true
    // gera uma linha digitável fictícia da GRFGTS
    const rand = Math.floor(10000000000000 + Math.random() * 90000000000000).toString()
    fgtsDigital.linhaDigitavel = `GRFGTS ${rand.slice(0,5)}.${rand.slice(5,10)} ${rand.slice(10,15)}.${rand.slice(0,5)} ${rand.slice(5,17)}`
    // atualiza histórico
    {
      const comp = fgtsDigital.competencia
      const idx = fgtsHistorico.findIndex(h => h.competencia === comp)
      const item: FgtsHistoricoItem = { competencia: comp, status: fgtsDigital.status, valorGuia: fgtsDigital.valorGuia, linhaDigitavel: fgtsDigital.linhaDigitavel }
      if (idx >= 0) fgtsHistorico[idx] = item; else fgtsHistorico.push(item)
    }
    const guia = {
      competencia: fgtsDigital.competencia,
      valor: fgtsDigital.valorGuia,
      linhaDigitavel: fgtsDigital.linhaDigitavel,
    }
    return res(ctx.status(200), ctx.json(guia))
  }),

  // FGTS Digital: POST marcar pago (exige guia disponível)
  rest.post('/api/impostos/fgts-digital/marcar-pago', (_req, res, ctx) => {
    if (!fgtsDigital.guiaDisponivel) {
      return res(ctx.status(400), ctx.json({ message: 'Não é possível marcar como pago sem guia disponível.' }))
    }
    fgtsDigital.status = 'Pago'
    return res(ctx.status(200), ctx.json(fgtsDigital))
  })

)

  

handlers.push(
  // FGTS Digital: GET histórico
  rest.get('/api/impostos/fgts-digital/historico', (_req, res, ctx) => {
    const sorted = [...fgtsHistorico].sort((a, b) => b.competencia.localeCompare(a.competencia))
    return res(ctx.status(200), ctx.json(sorted))
  }),

  // FGTS Digital: GET detalhes por colaborador
  rest.get('/api/impostos/fgts-digital/detalhes', (req, res, ctx) => {
    const comp = req.url.searchParams.get('competencia') || fgtsDigital.competencia
    const fgtsAliquota = Number(parametrosGerais?.aliquotaFgts || 8.0)
    const detalhes = colaboradores
      .filter(c => c.status === 'ativo')
      .map(c => {
        const salarioBruto = Number(c.salario || 0)
        const fgtsMes = Number((salarioBruto * (fgtsAliquota / 100)).toFixed(2))
        return {
          id: c.id,
          nome: c.nome,
          cargo: c.cargo,
          competencia: comp,
          salarioBruto,
          baseFgts: salarioBruto,
          aliquotaFgts: fgtsAliquota,
          fgtsMes,
        }
      })
    return res(ctx.status(200), ctx.json({ competencia: comp, detalhes }))
  })
)

// Dashboard: resumo geral
handlers.push(
  rest.get('/api/dashboard/summary', (_req, res, ctx) => {
    const totalColaboradores = colaboradores.length
    const colaboradoresAtivos = colaboradores.filter(c => c.status === 'ativo').length

    // Agregar saldo de banco de horas a partir de apuracaoData (strings +/-HH:MM)
    let totalMin = 0
    for (const d of apuracaoData) {
      const s = d.saldoDia || '00:00'
      const m = s.match(/^([+-]?)(\d{2}):(\d{2})$/)
      if (!m) continue
      const sign = m[1] === '-' ? -1 : 1
      const hh = parseInt(m[2], 10)
      const mm = parseInt(m[3], 10)
      totalMin += sign * (hh * 60 + mm)
    }
    const signChar = totalMin > 0 ? '+' : totalMin < 0 ? '-' : ''
    const absMin = Math.abs(totalMin)
    const horas = Math.floor(absMin / 60)
    const minutos = absMin % 60
    const saldoBancoHorasTotal = `${signChar}${horas}h ${minutos}m`

    const fmt = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
    const hoje = new Date()

    const fgtsStatusMap = fgtsDigital.status === 'Pago' ? 'success' : fgtsDigital.status === 'Guia Gerada' ? 'info' : 'warning'
    const dctfStatusMap = dctfweb.status === 'Pago' ? 'success' : dctfweb.status === 'Confessado' ? 'info' : 'warning'

    const ultimoApuracao = apuracaoData[apuracaoData.length - 1]
    const nomeUltimo = ultimoApuracao ? (colaboradores.find(c => c.id === ultimoApuracao.colaboradorId)?.nome || 'Colaborador') : 'Colaborador'

    const eventosRecentes = [
      { key: 1, tipo: 'FGTS Digital', descricao: `Status: ${fgtsDigital.status} (${fgtsDigital.competencia})`, data: fmt(hoje), status: fgtsStatusMap as 'info'|'success'|'warning'|'error' },
      { key: 2, tipo: 'DCTFWeb', descricao: `Status: ${dctfweb.status} (${dctfweb.competencia})`, data: fmt(hoje), status: dctfStatusMap as 'info'|'success'|'warning'|'error' },
      { key: 3, tipo: 'Ponto', descricao: `Ajuste de ponto: ${nomeUltimo}`, data: fmt(hoje), status: 'warning' },
      { key: 4, tipo: 'Benefícios', descricao: 'Atualizações recentes em benefícios', data: fmt(hoje), status: 'info' },
    ]

    const payload = {
      totalColaboradores,
      colaboradoresAtivos,
      saldoBancoHorasTotal,
      eventosRecentes,
    }

    return res(ctx.status(200), ctx.json(payload))
  })
)

  // ===== Fase 7: Benefícios =====

  type Beneficio = {

    key: React.Key;

    colaboradorId: number;

    colaboradorNome: string;

    tipo: 'VT' | 'VR' | 'VA' | 'Plano de Saúde';

    valor: number;

    status: 'ativo' | 'inativo';

  }

  

  let beneficios: Beneficio[] = [

    { key: 1, colaboradorId: 1, colaboradorNome: 'Ana Souza', tipo: 'VT', valor: 150, status: 'ativo' },

    { key: 2, colaboradorId: 1, colaboradorNome: 'Ana Souza', tipo: 'VR', valor: 450, status: 'ativo' },

    { key: 3, colaboradorId: 2, colaboradorNome: 'Bruno Lima', tipo: 'Plano de Saúde', valor: 300, status: 'ativo' },

    { key: 4, colaboradorId: 3, colaboradorNome: 'Carla Mendes', tipo: 'VT', valor: 200, status: 'inativo' },

  ];

  

  handlers.push(

    // Benefícios: GET lista

    rest.get('/api/beneficios', (_req, res, ctx) => {

      return res(ctx.status(200), ctx.json(beneficios));

    }),

  

    // Benefícios: POST (criar)

    rest.post('/api/beneficios', async (req, res, ctx) => {

      const body = (await req.json()) as Omit<Beneficio, 'key' | 'colaboradorNome'>;

      const colaborador = colaboradores.find(c => c.id === body.colaboradorId);

      if (!colaborador) {

        return res(ctx.status(400), ctx.json({ message: 'Colaborador não encontrado' }));

      }

      const newKey = beneficios.length ? Math.max(...beneficios.map(b => Number(b.key))) + 1 : 1;

      const novo: Beneficio = { ...body, key: newKey, colaboradorNome: colaborador.nome };

      beneficios.push(novo);

      return res(ctx.status(201), ctx.json(novo));

    }),

  

    // Benefícios: PUT (atualizar)

    rest.put('/api/beneficios/:key', async (req, res, ctx) => {

      const { key } = req.params;

      const numKey = Number(key);

      const body = (await req.json()) as Omit<Beneficio, 'key' | 'colaboradorNome'>;

      const colaborador = colaboradores.find(c => c.id === body.colaboradorId);

      if (!colaborador) {

        return res(ctx.status(400), ctx.json({ message: 'Colaborador não encontrado' }));

      }

      const idx = beneficios.findIndex(b => b.key === numKey);

      if (idx === -1) return res(ctx.status(404), ctx.json({ message: 'Not found' }));

      

      beneficios[idx] = { ...body, key: numKey, colaboradorNome: colaborador.nome };

      return res(ctx.status(200), ctx.json(beneficios[idx]));

    }),

  

    // Benefícios: DELETE (remover)

    rest.delete('/api/beneficios/:key', (req, res, ctx) => {

      const { key } = req.params;

      const numKey = Number(key);

      beneficios = beneficios.filter(b => b.key !== numKey);

      return res(ctx.status(204));

    })

  );

// ===== Organização: Filiais e Locais de Trabalho =====
type Filial = {
  id: number;
  nome: string; // Nome fantasia
  cnpj: string;
  cidade: string;
  estado: string;
  endereco?: string;
  status: 'Ativo' | 'Inativo';
}

type LocalTrabalho = {
  id: number;
  nome: string;
  tipo: 'Onsite' | 'Remoto' | 'Híbrido';
  filialId?: number;
  cidade?: string;
  estado?: string;
  endereco?: string;
  status: 'Ativo' | 'Inativo';
}

let filiais: Filial[] = [
  { id: 1, nome: 'Matriz', cnpj: '12.345.678/0001-90', cidade: 'São Paulo', estado: 'SP', endereco: 'Av. Paulista, 1000', status: 'Ativo' },
  { id: 2, nome: 'Filial SP', cnpj: '98.765.432/0002-10', cidade: 'Campinas', estado: 'SP', endereco: 'Rua Barão de Itapura, 200', status: 'Ativo' },
  { id: 3, nome: 'Filial RJ', cnpj: '11.222.333/0003-44', cidade: 'Rio de Janeiro', estado: 'RJ', endereco: 'Rua do Ouvidor, 300', status: 'Inativo' },
];

let locaisTrabalho: LocalTrabalho[] = [
  { id: 1, nome: 'Escritório Paulista', tipo: 'Onsite', filialId: 1, cidade: 'São Paulo', estado: 'SP', endereco: 'Av. Paulista, 1000', status: 'Ativo' },
  { id: 2, nome: 'Home Office Brasil', tipo: 'Remoto', status: 'Ativo' },
  { id: 3, nome: 'Hub Campinas', tipo: 'Híbrido', filialId: 2, cidade: 'Campinas', estado: 'SP', endereco: 'Rua Barão de Itapura, 200', status: 'Ativo' },
];

handlers.push(
  // Filiais: GET lista
  rest.get('/api/filiais', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(filiais));
  }),

  // Filiais: GET por ID
  rest.get('/api/filiais/:id', (req, res, ctx) => {
    const { id } = req.params;
    const numId = Number(id);
    const found = filiais.find(f => f.id === numId);
    if (!found) return res(ctx.status(404), ctx.json({ message: 'Not found' }));
    return res(ctx.status(200), ctx.json(found));
  }),

  // Filiais: POST (criar)
  rest.post('/api/filiais', async (req, res, ctx) => {
    const body = (await req.json()) as Omit<Filial, 'id'>;
    const newId = filiais.length ? Math.max(...filiais.map(f => f.id)) + 1 : 1;
    // Evita duplicidade de 'status': confia no valor enviado pelo cliente
    const novo: Filial = { id: newId, ...body };
    filiais.push(novo);
    return res(ctx.status(201), ctx.json(novo));
  }),

  // Filiais: PUT (atualizar)
  rest.put('/api/filiais/:id', async (req, res, ctx) => {
    const { id } = req.params;
    const numId = Number(id);
    const body = (await req.json()) as Omit<Filial, 'id'>;
    const idx = filiais.findIndex(f => f.id === numId);
    if (idx === -1) return res(ctx.status(404), ctx.json({ message: 'Not found' }));
    filiais[idx] = { ...filiais[idx], ...body, id: numId };
    return res(ctx.status(200), ctx.json(filiais[idx]));
  }),

  // Filiais: DELETE (remover)
  rest.delete('/api/filiais/:id', (req, res, ctx) => {
    const { id } = req.params;
    const numId = Number(id);
    filiais = filiais.filter(f => f.id !== numId);
    // Also remove locais vinculados
    locaisTrabalho = locaisTrabalho.filter(l => l.filialId !== numId);
    return res(ctx.status(204));
  }),

  // Locais de Trabalho: GET lista
  rest.get('/api/locais-trabalho', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(locaisTrabalho));
  }),

  // Locais de Trabalho: GET por ID
  rest.get('/api/locais-trabalho/:id', (req, res, ctx) => {
    const { id } = req.params;
    const numId = Number(id);
    const found = locaisTrabalho.find(l => l.id === numId);
    if (!found) return res(ctx.status(404), ctx.json({ message: 'Not found' }));
    return res(ctx.status(200), ctx.json(found));
  }),

  // Locais de Trabalho: POST (criar)
  rest.post('/api/locais-trabalho', async (req, res, ctx) => {
    const body = (await req.json()) as Omit<LocalTrabalho, 'id'>;
    const newId = locaisTrabalho.length ? Math.max(...locaisTrabalho.map(l => l.id)) + 1 : 1;
    // Evita duplicidade de 'status': confia no valor enviado pelo cliente
    const novo: LocalTrabalho = { id: newId, ...body };
    locaisTrabalho.push(novo);
    return res(ctx.status(201), ctx.json(novo));
  }),

  // Locais de Trabalho: PUT (atualizar)
  rest.put('/api/locais-trabalho/:id', async (req, res, ctx) => {
    const { id } = req.params;
    const numId = Number(id);
    const body = (await req.json()) as Omit<LocalTrabalho, 'id'>;
    const idx = locaisTrabalho.findIndex(l => l.id === numId);
    if (idx === -1) return res(ctx.status(404), ctx.json({ message: 'Not found' }));
    locaisTrabalho[idx] = { ...locaisTrabalho[idx], ...body, id: numId };
    return res(ctx.status(200), ctx.json(locaisTrabalho[idx]));
  }),

  // Locais de Trabalho: DELETE (remover)
  rest.delete('/api/locais-trabalho/:id', (req, res, ctx) => {
    const { id } = req.params;
    const numId = Number(id);
    locaisTrabalho = locaisTrabalho.filter(l => l.id !== numId);
    return res(ctx.status(204));
  }),

  // Conveniência: Locais por Filial
  rest.get('/api/filiais/:id/locais', (req, res, ctx) => {
    const { id } = req.params;
    const numId = Number(id);
    const locais = locaisTrabalho.filter(l => l.filialId === numId);
    return res(ctx.status(200), ctx.json(locais));
  })
);