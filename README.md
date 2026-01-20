# Salient KPIs Dashboard

A modern, real-time KPI visualization dashboard for client call data analytics. Built with Next.js, TypeScript, and Tailwind CSS, connecting to ClickHouse for data retrieval.

![Dashboard Preview](./docs/preview.png)

## Features

### Time Period Views
- **Daily**: View metrics aggregated by day (last 30 days)
- **Weekly**: View metrics aggregated by week (last 12 weeks)  
- **Monthly**: View metrics aggregated by month (last 12 months)

### Client Filtering
- **All Clients**: Consolidated view across all clients
- **Non-Westlake**: All clients excluding Westlake Financial
- **Per-Customer**: Individual client breakdown

### Key Metrics Tracked
- **Total Dials**: Number of outbound calls made
- **Connected**: Calls that successfully connected
- **Right Party Contact (RPC)**: Calls that reached the intended person
- **Transfers**: Calls transferred to agents
- **Resolution Rate**: Percentage of calls with insights that were resolved
- **Escalation Rate**: Percentage of RPC calls that resulted in transfers

### Visualizations
- Call volume trends (area chart)
- Resolution performance (combo bar/line chart)
- Call result distribution (horizontal bar chart)
- Client comparison (sortable by metric)
- Period summary table

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Database**: ClickHouse (for analytics queries)
- **Data Sources**: Supabase (replicated to ClickHouse)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Access to ClickHouse database

### Installation

1. Clone the repository:
```bash
cd salientkpis_cursor
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp env.example .env.local
```

Edit `.env.local` with your database credentials:
```env
# ClickHouse Configuration
CLICKHOUSE_HOST=your_clickhouse_host
CLICKHOUSE_PORT=8443
CLICKHOUSE_DATABASE=your_database
CLICKHOUSE_USER=your_username
CLICKHOUSE_PASSWORD=your_password

# Supabase Configuration (optional, for direct queries)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── kpis/           # KPI data endpoint
│   │   └── clients/        # Client list endpoint
│   ├── globals.css         # Global styles & animations
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main dashboard page
├── components/
│   ├── charts/             # Chart components
│   │   ├── CallVolumeChart.tsx
│   │   ├── ResolutionChart.tsx
│   │   ├── CallResultsChart.tsx
│   │   └── ClientComparisonChart.tsx
│   ├── Dashboard.tsx       # Main dashboard component
│   ├── KPICard.tsx         # KPI metric cards
│   ├── TimeFilter.tsx      # Time period selector
│   └── ClientFilter.tsx    # Client dropdown filter
├── hooks/
│   └── useKPIData.ts       # Data fetching hook
├── lib/
│   ├── clickhouse.ts       # ClickHouse connection & queries
│   └── utils.ts            # Utility functions
└── types/
    └── index.ts            # TypeScript type definitions
```

## API Endpoints

### GET /api/kpis

Fetches KPI data with various filtering options.

**Query Parameters:**
- `timePeriod`: `daily` | `weekly` | `monthly` (default: `weekly`)
- `clientFilter`: `all` | `non-westlake` | `{client_name}` (default: `all`)
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)
- `dataType`: `all` | `kpi` | `duration` | `comparison` (default: `all`)

**Response:**
```json
{
  "success": true,
  "data": {
    "timeSeries": [...],
    "aggregated": {...},
    "duration": [...],
    "clientComparison": [...],
    "meta": {
      "timePeriod": "weekly",
      "clientFilter": "all",
      "startDate": "...",
      "endDate": "...",
      "lastUpdated": "..."
    }
  }
}
```

### GET /api/clients

Returns list of available clients for filtering.

## Clients Supported

- ACA
- Ally Financial
- AutoNation
- CAC
- CarMax
- Credit One
- CPS
- Exeter Finance
- FinBe
- FTB
- GM Financial
- GoFi
- MAF
- Prestige
- Strike
- Tenet
- Tricolor
- UACC
- Universal
- Westlake Financial
- Yendo

## Call Result Codes

| Code | Description |
|------|-------------|
| ANX | Answering machine - no message |
| BADNO | Bad/invalid number |
| BGN | Busy/no answer |
| CBR | Callback requested |
| DEADAIR | Dead air/no response |
| FCC | Full compliance call |
| NOA | No answer |
| PHO | Phone contact |
| POP | Promise of payment |
| TPI | Third party contact |
| TTB | Talk to borrower |
| VML | Voicemail |
| WRONGNO | Wrong number |
| XCS | Transfer to agent |

## Customization

### Adding New Clients

1. Add the client name to `ALL_CLIENTS` in `src/types/index.ts`
2. Add display name mapping in `src/lib/utils.ts` 
3. Add color assignment in `CLIENT_COLORS` in `src/lib/utils.ts`
4. Ensure the ClickHouse table `supabase.call_{client}` exists

### Modifying Date Ranges

Default date ranges can be adjusted in `src/app/api/kpis/route.ts` in the `getDefaultDateRange` function.

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## License

Private - Internal use only

