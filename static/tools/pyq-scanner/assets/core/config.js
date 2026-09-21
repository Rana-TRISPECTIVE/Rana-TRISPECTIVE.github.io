/**
 * PYQs Pro - App Configuration & Defaults
 * Defines design constants, column definitions, seed data, and timer presets.
 */

export const APP_CONFIG = {
  NAME: 'PYQs Pro',
  AUTHOR: 'By Rana',
  TAGLINE: 'Mains PYQ Scanner & Study Management System',
  VERSION: '2.0.0',
  DB_NAME: 'pyqs_pro_database',
  DB_VERSION: 1
};

export const COLUMN_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  CHECKBOX: 'checkbox',
  SELECT: 'select',
  MARKDOWN: 'markdown'
};

export const TAG_COLORS = [
  { name: 'purple', label: 'Deep Purple / Core', bg: '#240d42', border: '#9333ea', text: '#f3e8ff' },
  { name: 'violet', label: 'Vibrant Violet / Highlight', bg: '#33085a', border: '#a855f7', text: '#fae8ff' },
  { name: 'indigo', label: 'Deep Indigo / Topic', bg: '#1a103c', border: '#7c3aed', text: '#e0e7ff' },
  { name: 'plum', label: 'Royal Plum / Review', bg: '#3b073e', border: '#c026d3', text: '#fce7f3' },
  { name: 'cyan', label: 'Cyan Glow / Subject', bg: '#06283d', border: '#0284c7', text: '#bae6fd' },
  { name: 'emerald', label: 'Emerald / Done', bg: '#022c22', border: '#059669', text: '#a7f3d0' },
  { name: 'amber', label: 'Amber / Medium', bg: '#451a03', border: '#d97706', text: '#fde68a' },
  { name: 'rose', label: 'Rose / Critical', bg: '#4c0519', border: '#e11d48', text: '#fecdd3' },
  { name: 'zinc', label: 'Zinc / Neutral', bg: '#18181b', border: '#52525b', text: '#d4d4d8' }
];

export const DEFAULT_COLUMNS = [
  {
    id: 'topic',
    name: 'Topic',
    type: 'select',
    width: 170,
    options: [
      { label: 'Public Finance', color: 'cyan' },
      { label: 'Macroeconomics', color: 'purple' },
      { label: 'National Accounts', color: 'blue' },
      { label: 'Union Budget', color: 'amber' },
      { label: 'Fiscal Policy', color: 'rose' }
    ]
  },
  {
    id: 'question',
    name: 'Mains Question',
    type: 'text',
    width: 320
  },
  {
    id: 'year',
    name: 'Year',
    type: 'number',
    width: 90
  },
  {
    id: 'marks',
    name: 'Marks',
    type: 'number',
    width: 85
  },
  {
    id: 'status',
    name: 'Status',
    type: 'select',
    width: 140,
    options: [
      { label: 'Review', color: 'rose' },
      { label: 'In Progress', color: 'amber' },
      { label: 'To Do', color: 'zinc' },
      { label: 'Verified', color: 'emerald' }
    ]
  },
  {
    id: 'verified',
    name: 'Verified',
    type: 'checkbox',
    width: 95
  },
  {
    id: 'notes',
    name: 'Study Notes & Markdown',
    type: 'markdown',
    width: 340
  }
];

export const DEFAULT_SEED_DATA = [
  {
    id: 'pyq_seed_1',
    bookmarked: true,
    cells: {
      topic: 'Public Finance',
      question: 'Distinguish between Fiscal Deficit and Revenue Deficit. Explain the macroeconomic implications of a persistent high fiscal deficit on capital formation.',
      year: 2024,
      marks: 15,
      status: 'Review',
      verified: true,
      notes: `**Key Formulas & Implications**:
* **Fiscal Deficit**: \`FD = Total Expenditure - Total Receipts (excl. Borrowings)\`
* **Revenue Deficit**: \`RD = Revenue Expenditure - Revenue Receipts\`
* **Crowding-Out Effect**: High government borrowing raises domestic bond yields and reduces loanable private investment funds.`
    }
  },
  {
    id: 'pyq_seed_2',
    bookmarked: false,
    cells: {
      topic: 'Union Budget',
      question: 'Elucidate the constitutional provisions and procedural stages through which the Union Budget passes in the Parliament before becoming an Act.',
      year: 2023,
      marks: 15,
      status: 'In Progress',
      verified: true,
      notes: `**Article 112** mandates the Annual Financial Statement.
Passes through **6 essential parliamentary stages**:
1. Presentation of Budget
2. General Discussion
3. Scrutiny by Departmental Standing Committees
4. Voting on Demands for Grants (Lok Sabha exclusive)
5. Passing of Appropriation Bill (Article 114)
6. Passing of Finance Bill (Taxation proposals)`
    }
  },
  {
    id: 'pyq_seed_3',
    bookmarked: true,
    cells: {
      topic: 'National Accounts',
      question: 'Compare the Expenditure Method and Gross Value Added (GVA) method for GDP estimation. Why did India transition from GDP at Factor Cost to GVA at Basic Prices in 2015?',
      year: 2022,
      marks: 10,
      status: 'To Do',
      verified: false,
      notes: `**Three Methods of Calculation**:
* **Expenditure Approach**: \`GDP = C + I + G + (X - M)\`
* **GVA at Basic Prices**: \`GVA = Output - Intermediate Consumption\`
* **2015 Revision**: Aligned with *UN SNA 2008* international standards to better account for production taxes less production subsidies.`
    }
  },
  {
    id: 'pyq_seed_4',
    bookmarked: false,
    cells: {
      topic: 'Fiscal Policy',
      question: 'What are the core recommendations of the N.K. Singh FRBM Review Committee? How has the debt-to-GDP ratio target influenced post-pandemic consolidation trajectories?',
      year: 2021,
      marks: 15,
      status: 'Review',
      verified: false,
      notes: `**Target Recommendations**:
* **General Government Debt Target**: 60% of GDP (40% Central, 20% State) by 2023.
* **Fiscal Deficit Target**: 2.5% for Centre.
* **Escape Clause**: Allows deviations up to 0.5% during national emergencies, war, and severe agricultural distress.`
    }
  },
  {
    id: 'pyq_seed_5',
    bookmarked: false,
    cells: {
      topic: 'Macroeconomics',
      question: 'Examine the Monetary Policy Transmission Mechanism in India. Analyze the challenges faced by RBI in reducing lending rates through repo rate cuts.',
      year: 2020,
      marks: 10,
      status: 'Verified',
      verified: true,
      notes: `**Structural Bottlenecks**:
1. High share of fixed-rate long-term bank deposits.
2. Competition from government Small Savings Schemes offering sticky higher yields.
3. Balance sheet stress and NPAs dampening credit creation.`
    }
  }
];

export const TIMER_PRESETS = [
  { label: '25 min', minutes: 25, description: 'Pomodoro Answer Writing' },
  { label: '45 min', minutes: 45, description: '3-Question Mains Drill' },
  { label: '1 hour', minutes: 60, description: 'Essay / 4-Question Block' },
  { label: '1.5 hours', minutes: 90, description: 'Full Sectional Test' }
];

export const ROW_LIMIT_OPTIONS = [20, 50, 100, 500, 'All'];
