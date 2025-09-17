'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Upload, FileText, Award, Building, TrendingUp, DollarSign, Search, Filter, Download, Mail, Copy, AlertCircle, ChevronDown, Calendar, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import { useUser } from '@clerk/clerk-react';
import { canAccessFeature } from '@/lib/utils/planChecker';
import UpgradePrompt from '@/components/UpgradePrompt';

// Sample grants database - in production this would come from API
const AVAILABLE_GRANTS = [
  {
    id: 'sbir-2024-q1',
    title: 'SBIR Phase I - Advanced Manufacturing',
    agency: 'National Science Foundation',
    type: 'sbir',
    amount: '$275,000',
    deadline: '2024-03-15',
    status: 'open',
    matchScore: 95,
    requirements: ['Technology innovation', 'Commercialization plan', 'Small business'],
    description: 'Support for breakthrough technologies in advanced manufacturing with clear commercialization potential.',
    tags: ['technology', 'manufacturing', 'innovation'],
    difficulty: 'high'
  },
  {
    id: 'sba-2024-growth',
    title: 'SBA Growth Accelerator Fund',
    agency: 'Small Business Administration',
    type: 'sba',
    amount: '$50,000',
    deadline: '2024-02-28',
    status: 'open',
    matchScore: 88,
    requirements: ['Established business', 'Growth plan', 'Job creation'],
    description: 'Funding for established small businesses ready to scale operations and create jobs.',
    tags: ['growth', 'jobs', 'scaling'],
    difficulty: 'medium'
  },
  {
    id: 'minority-tech-2024',
    title: 'Minority-Owned Tech Startup Grant',
    agency: 'Department of Commerce',
    type: 'minority_business',
    amount: '$100,000',
    deadline: '2024-04-01',
    status: 'open',
    matchScore: 82,
    requirements: ['Minority ownership', 'Technology focus', 'Business plan'],
    description: 'Supporting diversity in technology entrepreneurship through targeted funding.',
    tags: ['minority', 'technology', 'startup'],
    difficulty: 'medium'
  },
  {
    id: 'women-stem-2024',
    title: 'Women in STEM Innovation Fund',
    agency: 'National Science Foundation',
    type: 'women_business',
    amount: '$150,000',
    deadline: '2024-03-30',
    status: 'open',
    matchScore: 76,
    requirements: ['Women-owned business', 'STEM focus', 'Innovation potential'],
    description: 'Empowering women entrepreneurs in science, technology, engineering, and mathematics.',
    tags: ['women', 'stem', 'innovation'],
    difficulty: 'medium'
  },
  {
    id: 'research-climate-2024',
    title: 'Climate Research Innovation Grant',
    agency: 'Department of Energy',
    type: 'research',
    amount: '$500,000',
    deadline: '2024-05-15',
    status: 'open',
    matchScore: 70,
    requirements: ['Research focus', 'Climate impact', 'Academic partnership'],
    description: 'Supporting research initiatives that address climate change challenges.',
    tags: ['climate', 'research', 'environment'],
    difficulty: 'high'
  }
];

const PROPOSAL_TYPES = {
  grant_match: {
    label: 'Grant Proposal Match',
    description: 'Match your business plan with available grants and create tailored proposals',
    icon: <Award className="h-5 w-5" />,
    color: 'bg-blue-500'
  },
  bank_loan: {
    label: 'Bank Loan Application',
    description: 'Create a professional bank loan application document',
    icon: <Building className="h-5 w-5" />,
    color: 'bg-green-500'
  },
  investor_pitch: {
    label: 'Investor Pitch',
    description: 'Generate an investor presentation and pitch document',
    icon: <TrendingUp className="h-5 w-5" />,
    color: 'bg-purple-500'
  },
  general_loan: {
    label: 'General Loan',
    description: 'Create a general loan application document',
    icon: <DollarSign className="h-5 w-5" />,
    color: 'bg-orange-500'
  }
};

export default function GrantProposalsPage() {
  const { user } = useUser();
  const canCreateProposals = canAccessFeature(user, 'grant-proposal-creation');

  // Workflow steps
  const [currentStep, setCurrentStep] = useState(1); // 1: Choose Source, 2: Select Type, 3: Select Grant (if applicable), 4: Generate

  // Step 1: Business Plan Source
  const [selectedSource, setSelectedSource] = useState(null); // 'upload' or 'saved'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [savedBusinessPlans, setSavedBusinessPlans] = useState([]);
  const [selectedBusinessPlan, setSelectedBusinessPlan] = useState(null);
  const [loadingBusinessPlans, setLoadingBusinessPlans] = useState(false);

  // Step 2: Proposal Type
  const [selectedProposalType, setSelectedProposalType] = useState(null);

  // Step 3: Grant Selection (for grant_match only)
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [filteredGrants, setFilteredGrants] = useState(AVAILABLE_GRANTS);
  const [searchTerm, setSearchTerm] = useState('');

  // Step 4: Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState(null);
  const [generationError, setGenerationError] = useState('');

  // Load saved business plans on mount
  useEffect(() => {
    if (user) {
      loadSavedBusinessPlans();
    }
  }, [user]);

  // Filter grants based on search
  useEffect(() => {
    if (searchTerm) {
      const filtered = AVAILABLE_GRANTS.filter(grant =>
        grant.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grant.agency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grant.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredGrants(filtered);
    } else {
      setFilteredGrants(AVAILABLE_GRANTS);
    }
  }, [searchTerm]);

  const loadSavedBusinessPlans = async () => {
    try {
      setLoadingBusinessPlans(true);
      const response = await fetch('/api/documents?type=business_plan');
      if (response.ok) {
        const data = await response.json();
        setSavedBusinessPlans(data.documents || []);
      }
    } catch (error) {
      console.error('Error loading saved business plans:', error);
      setSavedBusinessPlans([]);
    } finally {
      setLoadingBusinessPlans(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate PDF file
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file only.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB.');
        return;
      }
      setUploadedFile(file);
      setSelectedSource('upload');
      setSelectedBusinessPlan(null);
    }
  };

  const handleSavedPlanSelect = (plan) => {
    setSelectedBusinessPlan(plan);
    setSelectedSource('saved');
    setUploadedFile(null);
  };

  const handleProposalTypeSelect = (type) => {
    setSelectedProposalType(type);
    if (type !== 'grant_match') {
      setSelectedGrant(null);
    }
  };

  const canProceedToStep = (step) => {
    switch (step) {
      case 2:
        return selectedSource && (uploadedFile || selectedBusinessPlan);
      case 3:
        return selectedProposalType;
      case 4:
        return selectedProposalType !== 'grant_match' || selectedGrant;
      default:
        return true;
    }
  };

  const handleGenerateProposal = async () => {
    if (!canProceedToStep(4)) {
      setGenerationError('Please complete all previous steps');
      return;
    }

    setIsGenerating(true);
    setGenerationError('');
    setCurrentStep(4);

    try {
      const businessPlanContent = selectedSource === 'upload'
        ? await extractPDFContent(uploadedFile)
        : selectedBusinessPlan.content || selectedBusinessPlan.summary;

      // For demo purposes, create a mock proposal
      console.log('Generating proposal for:', selectedProposalType);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      let mockContent;
      if (selectedProposalType === 'grant_match' && selectedGrant) {
        const businessName = selectedBusinessPlan?.title || uploadedFile?.name?.replace('.pdf', '') || '[Your Business Name]';
        const today = new Date();
        const deadline = new Date(selectedGrant.deadline);
        const daysUntilDeadline = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

        mockContent = `# Grant Proposal Submission
## ${selectedGrant.title}
### Submitted to: ${selectedGrant.agency}

---

**Date of Submission:** ${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Application Deadline:** ${deadline.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Requested Amount:** ${selectedGrant.amount}
**Applicant Organization:** ${businessName}

---

## Executive Summary

We respectfully submit this comprehensive proposal to ${selectedGrant.agency} requesting ${selectedGrant.amount} in funding for our innovative business initiative. Our organization has been strategically positioned to address critical market needs while directly advancing the grant's core mission of ${selectedGrant.description.toLowerCase()}.

**Key Highlights:**
• Established business with proven track record and experienced leadership team
• Innovative solution addressing significant market gap and community needs
• Strong alignment with all grant requirements: ${selectedGrant.requirements.join(', ')}
• Clear implementation plan with measurable outcomes and accountability measures
• Sustainable business model ensuring long-term impact beyond the grant period

## Organization Background and Qualifications

### Company Overview
${businessName} represents a forward-thinking organization committed to innovation, community impact, and sustainable growth. Our leadership team brings together decades of combined experience in business development, project management, and industry expertise.

### Organizational Capacity
- **Leadership Team:** Experienced professionals with proven track record in business development and project execution
- **Operational Infrastructure:** Established systems for project management, financial reporting, and compliance monitoring
- **Previous Achievements:** Demonstrated success in similar initiatives with quantifiable outcomes
- **Community Standing:** Strong reputation and established relationships with key stakeholders

### Relevant Experience
Our organization has successfully managed projects of similar scope and complexity, consistently delivering results on time and within budget. We have experience working with government agencies and understand the importance of compliance, reporting, and accountability.

## Project Description and Methodology

### Problem Statement
Our comprehensive market analysis has identified a critical gap that our business is uniquely positioned to address. This opportunity aligns perfectly with ${selectedGrant.agency}'s funding priorities and the specific focus areas outlined in the ${selectedGrant.title} program.

### Proposed Solution
We propose a comprehensive initiative that will:

**Phase 1: Foundation and Planning (Months 1-6)**
- Conduct detailed market research and feasibility studies
- Establish key partnerships and stakeholder relationships
- Develop comprehensive operational protocols and quality assurance measures
- Recruit and train essential personnel
- Establish monitoring and evaluation systems

**Phase 2: Implementation and Launch (Months 7-12)**
- Execute core business operations and service delivery
- Implement marketing and customer acquisition strategies
- Monitor performance metrics and adjust strategies as needed
- Establish sustainable revenue streams
- Document best practices and lessons learned

**Phase 3: Expansion and Sustainability (Year 2 and Beyond)**
- Scale operations to maximize impact and reach
- Explore additional funding opportunities and revenue diversification
- Mentor other organizations seeking to implement similar initiatives
- Contribute to industry knowledge and best practices

### Innovation and Unique Approach
Our methodology incorporates cutting-edge practices and innovative approaches that set us apart from traditional solutions. We leverage technology, data-driven decision making, and community engagement to maximize impact and ensure sustainable outcomes.

## Goals, Objectives, and Expected Outcomes

### Primary Goals
1. **Economic Impact:** Generate sustainable economic benefits for the community
2. **Innovation Advancement:** Contribute to industry knowledge and best practices
3. **Community Development:** Address identified needs and improve quality of life
4. **Workforce Development:** Create meaningful employment opportunities

### Specific Objectives
- **Short-term (6 months):** Establish operational foundation and key partnerships
- **Medium-term (12 months):** Achieve operational sustainability and initial impact metrics
- **Long-term (24+ months):** Demonstrate scalable model and contribute to sector advancement

### Measurable Outcomes
- **Economic Metrics:** Revenue generation, cost savings, return on investment
- **Social Impact:** Jobs created, individuals served, community benefits
- **Innovation Metrics:** Best practices developed, knowledge transfer, industry advancement
- **Sustainability Indicators:** Self-sufficiency timeline, continued operation beyond grant period

## Implementation Timeline and Milestones

### Detailed Project Timeline

**Months 1-2: Project Initiation**
- Execute grant agreement and establish reporting protocols
- Finalize team recruitment and organizational structure
- Conduct detailed project planning and risk assessment
- Establish partnerships and vendor relationships

**Months 3-4: Development Phase**
- Complete market research and competitive analysis
- Develop operational procedures and quality standards
- Implement technology infrastructure and systems
- Begin staff training and capacity building

**Months 5-6: Pre-Launch Preparation**
- Complete pilot testing and system validation
- Finalize marketing and communication strategies
- Establish performance monitoring systems
- Conduct final preparations for operational launch

**Months 7-9: Initial Implementation**
- Launch core operations and service delivery
- Implement customer acquisition and retention strategies
- Monitor performance metrics and adjust operations
- Conduct quarterly evaluation and reporting

**Months 10-12: Optimization and Growth**
- Scale operations based on initial performance data
- Implement continuous improvement processes
- Develop sustainability planning and funding diversification
- Complete comprehensive program evaluation

### Key Milestones and Deliverables
- **Month 3:** Completion of planning phase and team establishment
- **Month 6:** Operational readiness and system validation
- **Month 9:** Achievement of initial performance targets
- **Month 12:** Demonstration of sustainability and scalability

## Budget and Financial Plan

### Total Project Budget: ${selectedGrant.amount}

**Personnel Costs (60% - ${(parseInt(selectedGrant.amount.replace(/[^0-9]/g, '')) * 0.60).toLocaleString()}):**
- Executive leadership and project management
- Operational staff and technical specialists
- Training and professional development
- Benefits and administrative support

**Equipment and Technology (20% - ${(parseInt(selectedGrant.amount.replace(/[^0-9]/g, '')) * 0.20).toLocaleString()}):**
- Technology infrastructure and software systems
- Equipment and tools necessary for operations
- Office setup and communication systems

**Operations and Program Costs (15% - ${(parseInt(selectedGrant.amount.replace(/[^0-9]/g, '')) * 0.15).toLocaleString()}):**
- Marketing and outreach activities
- Travel and transportation costs
- Supplies and materials
- Utilities and operational expenses

**Administrative Costs (5% - ${(parseInt(selectedGrant.amount.replace(/[^0-9]/g, '')) * 0.05).toLocaleString()}):**
- Financial management and accounting
- Legal and compliance costs
- Insurance and risk management
- Reporting and evaluation activities

### Cost-Benefit Analysis
Our detailed financial analysis demonstrates that the requested investment will generate significant returns through:
- Direct economic impact exceeding the grant amount within 24 months
- Indirect community benefits valued at multiple times the initial investment
- Knowledge and best practices that can benefit similar organizations
- Sustainable business model ensuring continued impact beyond the grant period

### Matching Funds and Sustainability
We are committed to providing matching resources including:
- In-kind contributions valued at 25% of the requested amount
- Committed funding from other sources totaling 15% of project costs
- Revenue projections indicating self-sufficiency within 18 months

## Risk Management and Mitigation Strategies

### Identified Risks and Mitigation Plans

**Market Risk:** Changes in market conditions or demand
- *Mitigation:* Diverse revenue streams and flexible business model

**Operational Risk:** Challenges in project implementation or performance
- *Mitigation:* Experienced team, detailed planning, and contingency protocols

**Financial Risk:** Budget overruns or funding shortfalls
- *Mitigation:* Conservative budgeting, multiple funding sources, and financial monitoring

**Regulatory Risk:** Changes in regulations or compliance requirements
- *Mitigation:* Legal counsel, compliance monitoring, and adaptive procedures

### Quality Assurance and Performance Monitoring
We will implement comprehensive monitoring systems including:
- Monthly financial reporting and budget analysis
- Quarterly performance reviews and stakeholder updates
- Annual comprehensive evaluation and impact assessment
- Continuous improvement processes and adaptive management

## Evaluation and Reporting Plan

### Performance Measurement Framework
Our evaluation plan includes both quantitative and qualitative metrics:

**Quantitative Measures:**
- Financial performance indicators (revenue, costs, ROI)
- Operational metrics (customers served, products delivered, efficiency measures)
- Employment statistics (jobs created, wages, benefits)
- Community impact numbers (individuals served, problems addressed)

**Qualitative Measures:**
- Stakeholder satisfaction surveys and feedback
- Case studies and success stories
- Best practices documentation
- Innovation and improvement initiatives

### Reporting Schedule
- **Monthly:** Financial reports and operational updates
- **Quarterly:** Comprehensive performance reports with analysis and recommendations
- **Annually:** Complete program evaluation with impact assessment and lessons learned
- **Final Report:** Comprehensive project summary with outcomes, impact, and sustainability plan

## Community Impact and Social Benefits

### Direct Community Benefits
Our initiative will provide immediate and tangible benefits to the community including:
- Economic development and job creation
- Enhanced services and improved quality of life
- Innovation and technological advancement
- Capacity building and knowledge transfer

### Long-term Societal Impact
Beyond immediate benefits, our project will contribute to:
- Sustainable economic development models
- Industry best practices and innovation
- Community resilience and self-sufficiency
- Knowledge base for future similar initiatives

### Stakeholder Engagement Plan
We are committed to meaningful engagement with all stakeholders including:
- Regular community meetings and updates
- Transparent communication and feedback mechanisms
- Collaborative decision-making processes
- Ongoing partnership development and maintenance

## Organizational Sustainability and Future Plans

### Post-Grant Sustainability Strategy
Our comprehensive sustainability plan ensures continued impact beyond the grant period:

**Revenue Diversification:**
- Multiple revenue streams reducing dependency on grant funding
- Fee-for-service models ensuring ongoing operational support
- Product sales and licensing opportunities
- Additional grant funding from diverse sources

**Organizational Development:**
- Strong governance structure and leadership succession planning
- Robust financial management and reserve fund development
- Continuous staff development and capacity building
- Strategic partnerships ensuring long-term viability

### Future Growth and Expansion Plans
Upon successful completion of this initiative, we plan to:
- Expand services to additional geographic areas or market segments
- Develop new products and services based on lessons learned
- Serve as a model for other organizations and communities
- Contribute to policy development and industry advancement

## Conclusion and Call to Action

We are honored to submit this proposal to ${selectedGrant.agency} and respectfully request your partnership in this transformative initiative. Our comprehensive plan demonstrates:

✓ **Clear Alignment** with grant objectives and funding priorities
✓ **Proven Capability** through experienced leadership and organizational capacity
✓ **Innovative Approach** addressing critical needs with sustainable solutions
✓ **Measurable Impact** with quantifiable outcomes and accountability measures
✓ **Long-term Sustainability** ensuring continued benefit beyond the grant period

### Why This Investment Matters
Your investment in our organization represents more than funding - it represents a partnership in creating lasting positive change. The ${selectedGrant.amount} requested will:
- Generate economic returns exceeding the initial investment
- Create sustainable employment and business opportunities
- Advance innovation and industry best practices
- Strengthen community resilience and self-sufficiency

### Our Commitment to Excellence
We pledge to:
- Execute this project with the highest standards of professionalism and integrity
- Maintain transparent communication and comprehensive reporting
- Achieve or exceed all performance targets and objectives
- Serve as responsible stewards of public funding
- Contribute to the advancement of ${selectedGrant.agency}'s mission and goals

### Next Steps
We stand ready to begin implementation immediately upon award notification and look forward to partnering with ${selectedGrant.agency} in this important work. Our team is available to provide any additional information or clarification needed to support your decision-making process.

---

**Contact Information:**
**Primary Contact:** [Project Director Name]
**Organization:** ${businessName}
**Email:** [director@yourbusiness.com]
**Phone:** [555-123-4567]
**Address:** [Business Address]

**Grant Information:**
**Program:** ${selectedGrant.title}
**Agency:** ${selectedGrant.agency}
**Submission Date:** ${today.toLocaleDateString()}
**Requested Amount:** ${selectedGrant.amount}

---

*This proposal represents our commitment to excellence, accountability, and positive community impact. We thank you for your consideration and look forward to the opportunity to serve as your partner in this important initiative.*

**Attachments:**
- Detailed Budget Spreadsheet
- Organizational Chart and Staff Resumes
- Letters of Support from Community Partners
- Financial Statements and Audit Reports
- Project Timeline and Milestone Calendar`;
      } else {
        const typeLabels = {
          bank_loan: 'Bank Loan Application',
          investor_pitch: 'Investor Pitch Presentation',
          general_loan: 'General Loan Application'
        };

        const businessName = selectedBusinessPlan?.title || uploadedFile?.name?.replace('.pdf', '') || '[Your Business Name]';
        const today = new Date();
        const requestedAmount = selectedProposalType === 'bank_loan' ? '$250,000' : selectedProposalType === 'investor_pitch' ? '$500,000' : '$150,000';

        if (selectedProposalType === 'bank_loan') {
          mockContent = `# Commercial Loan Application
## ${businessName}

---

**Application Date:** ${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Requested Loan Amount:** ${requestedAmount}
**Loan Purpose:** Business Operations and Growth Capital
**Applicant:** ${businessName}

---

## Executive Summary

${businessName} respectfully requests a commercial loan of ${requestedAmount} to support our business operations, working capital needs, and strategic growth initiatives. Our established business demonstrates strong financial performance, experienced management, and a clear path to profitability that ensures reliable loan repayment.

**Key Loan Highlights:**
• Established business with proven revenue track record
• Strong creditworthiness and financial stability
• Clear repayment plan with conservative projections
• Collateral and security measures to protect lender interests
• Experienced management team with industry expertise

## Business Overview and Operations

### Company Profile
${businessName} is a well-established business operating in a stable market with consistent demand for our products and services. Our company has built a strong reputation for quality, reliability, and customer satisfaction.

### Business Operations
- **Years in Operation:** [X] years of successful business operations
- **Legal Structure:** [Corporation/LLC/Partnership]
- **Primary Business Activities:** [Core business description]
- **Target Market:** [Customer demographics and market segments]
- **Geographic Scope:** [Local/Regional/National operations]

### Management Team
Our experienced leadership team brings together decades of industry experience and proven business acumen:
- **CEO/President:** [Name and background]
- **CFO/Financial Manager:** [Name and background]
- **Operations Manager:** [Name and background]

## Financial Position and Performance

### Current Financial Status
Our financial records demonstrate consistent profitability and strong cash flow management:

**Revenue Performance (Last 3 Years):**
- Year 1: $[XXX,XXX] - Gross Revenue
- Year 2: $[XXX,XXX] - Gross Revenue (X% growth)
- Year 3: $[XXX,XXX] - Gross Revenue (X% growth)

**Profitability Metrics:**
- Gross Profit Margin: X%
- Net Profit Margin: X%
- EBITDA: $[XXX,XXX]

### Balance Sheet Summary
**Assets:**
- Current Assets: $[XXX,XXX]
- Fixed Assets: $[XXX,XXX]
- Total Assets: $[XXX,XXX]

**Liabilities and Equity:**
- Current Liabilities: $[XXX,XXX]
- Long-term Debt: $[XXX,XXX]
- Owner's Equity: $[XXX,XXX]

### Cash Flow Analysis
Our cash flow projections demonstrate strong ability to service debt obligations:
- Monthly Operating Cash Flow: $[XX,XXX]
- Debt Service Coverage Ratio: X.X
- Current Ratio: X.X
- Quick Ratio: X.X

## Loan Request Details

### Use of Funds
The requested ${requestedAmount} will be allocated as follows:

**Working Capital (60% - ${(parseInt(requestedAmount.replace(/[^0-9]/g, '')) * 0.60).toLocaleString()}):**
- Inventory management and procurement
- Accounts receivable financing
- Seasonal cash flow management
- Operational expense coverage

**Equipment and Infrastructure (25% - ${(parseInt(requestedAmount.replace(/[^0-9]/g, '')) * 0.25).toLocaleString()}):**
- Equipment purchases and upgrades
- Technology infrastructure improvements
- Facility improvements and expansion

**Growth Initiatives (15% - ${(parseInt(requestedAmount.replace(/[^0-9]/g, '')) * 0.15).toLocaleString()}):**
- Marketing and customer acquisition
- New product development
- Market expansion activities

### Repayment Plan
**Proposed Loan Terms:**
- Loan Amount: ${requestedAmount}
- Proposed Term: 5 years
- Estimated Monthly Payment: $[X,XXX]
- Interest Rate: [Market Rate + X%]

**Repayment Source:**
Primary repayment will come from operating cash flow, with projected monthly cash generation of $[XX,XXX], providing comfortable coverage for debt service obligations.

## Collateral and Security

### Primary Collateral
- **Real Estate:** [Property description and estimated value]
- **Equipment:** [Equipment list and current market value]
- **Inventory:** [Current inventory value and turnover rate]
- **Accounts Receivable:** [Outstanding receivables and collection history]

### Personal Guarantees
The business owners are prepared to provide personal guarantees for the loan, demonstrating our confidence in the business and commitment to repayment.

### Insurance Coverage
Comprehensive insurance coverage protects all collateral and business operations:
- General Liability Insurance: $[X,XXX,XXX]
- Property Insurance: $[XXX,XXX]
- Business Interruption Insurance: $[XXX,XXX]
- Key Person Life Insurance: $[XXX,XXX]

## Market Analysis and Competitive Position

### Industry Overview
Our industry shows stable growth patterns with consistent demand drivers:
- Market Size: $[XXX] million annually
- Growth Rate: X% annually
- Market Trends: [Positive industry trends]

### Competitive Advantages
- **Established Customer Base:** Long-term relationships with key clients
- **Operational Efficiency:** Streamlined processes and cost controls
- **Market Position:** Strong brand recognition and reputation
- **Financial Stability:** Conservative financial management and reserves

### Risk Mitigation
We have identified and addressed key business risks:
- **Market Risk:** Diversified customer base and multiple revenue streams
- **Operational Risk:** Experienced management and redundant systems
- **Financial Risk:** Conservative financial planning and cash reserves
- **Credit Risk:** Strong collection procedures and customer screening

## Growth Strategy and Future Projections

### Business Growth Plan
Our strategic growth plan focuses on sustainable expansion:

**Year 1 Objectives:**
- Increase revenue by X% through expanded marketing
- Improve operational efficiency by X%
- Expand customer base by X new accounts

**Years 2-3 Objectives:**
- Enter new geographic markets
- Launch additional product lines
- Achieve $[XXX,XXX] annual revenue

### Financial Projections
**Conservative Revenue Projections:**
- Year 1: $[XXX,XXX] (X% growth)
- Year 2: $[XXX,XXX] (X% growth)
- Year 3: $[XXX,XXX] (X% growth)

**Profitability Outlook:**
- Maintained gross margins of X%
- Controlled expense growth
- Improved EBITDA margins

## Banking Relationship and References

### Current Banking Relationships
- **Primary Bank:** [Bank Name] - [Years of relationship]
- **Account Types:** Checking, Savings, Credit Line
- **Banking History:** Excellent standing with no defaults

### Professional References
- **CPA/Accountant:** [Name, Firm, Contact Information]
- **Attorney:** [Name, Firm, Contact Information]
- **Key Customers:** [Reference list available upon request]
- **Suppliers:** [Trade references with payment history]

## Legal and Regulatory Compliance

### Business Licenses and Permits
- All required business licenses current and in good standing
- Industry-specific permits and certifications maintained
- Regular compliance audits and updates

### Legal Structure and Documentation
- Corporate documents and bylaws current
- Operating agreements properly executed
- Insurance policies and coverage adequate
- Employment and contract documentation compliant

## Risk Assessment and Management

### Identified Business Risks
**Market Risks:**
- Economic downturns affecting customer demand
- *Mitigation:* Diversified customer base and flexible operations

**Operational Risks:**
- Key person dependency and operational disruptions
- *Mitigation:* Cross-training, succession planning, insurance coverage

**Financial Risks:**
- Cash flow fluctuations and collection issues
- *Mitigation:* Conservative financial planning and credit monitoring

### Contingency Planning
We maintain comprehensive contingency plans including:
- Emergency cash reserves
- Alternative supplier relationships
- Flexible staffing arrangements
- Business interruption insurance

## Conclusion and Loan Request Summary

${businessName} presents a compelling loan opportunity combining:

✓ **Proven Track Record** - Years of successful operations and profitability
✓ **Strong Financial Position** - Healthy balance sheet and cash flow
✓ **Conservative Request** - Loan amount well-supported by assets and cash flow
✓ **Clear Repayment Plan** - Multiple sources of repayment and strong coverage ratios
✓ **Professional Management** - Experienced team with industry expertise

### Why This Loan Makes Sense
This loan represents a low-risk opportunity for the bank to support an established, profitable business with:
- Strong collateral coverage exceeding loan amount
- Conservative debt-to-equity ratios
- Proven ability to generate consistent cash flow
- Experienced management with long-term commitment

### Our Commitment
We are committed to:
- Maintaining open communication with the bank
- Providing regular financial reporting
- Adhering to all loan covenants and requirements
- Building a long-term banking partnership

We respectfully request your favorable consideration of our loan application and look forward to discussing this opportunity in detail.

---

**Loan Application Summary:**
**Applicant:** ${businessName}
**Requested Amount:** ${requestedAmount}
**Purpose:** Working Capital and Growth
**Proposed Term:** 5 years
**Application Date:** ${today.toLocaleDateString()}

**Contact Information:**
**Primary Contact:** [Business Owner/President]
**Phone:** [555-123-4567]
**Email:** [owner@yourbusiness.com]
**Business Address:** [Complete Business Address]

---

**Attachments Provided:**
- Three years of financial statements (audited)
- Personal financial statements of guarantors
- Business tax returns (last 3 years)
- Bank statements (last 12 months)
- Accounts receivable aging report
- Equipment and asset appraisals
- Business plan and projections
- Legal documents and licenses`;

        } else if (selectedProposalType === 'investor_pitch') {
          mockContent = `# Investment Opportunity
## ${businessName}
### Seeking ${requestedAmount} Series A Funding

---

**Presentation Date:** ${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Investment Sought:** ${requestedAmount}
**Valuation:** $5,000,000 pre-money
**Use of Funds:** Market expansion, product development, team growth

---

## Executive Summary

${businessName} represents an exceptional investment opportunity in the rapidly growing [industry] sector. We are seeking ${requestedAmount} in Series A funding to accelerate our market expansion, enhance our product offerings, and build the team necessary to capture the significant market opportunity ahead of us.

**Investment Highlights:**
• Proven business model with strong unit economics
• Experienced founding team with track record of success
• Large and growing target market ($XX billion TAM)
• Proprietary technology and sustainable competitive advantages
• Clear path to profitability and scalable business model
• Strong customer traction and retention metrics

## The Problem We Solve

### Market Problem
The [industry] market faces significant challenges that create substantial opportunity for innovative solutions:

**Key Pain Points:**
- [Specific problem #1] affecting XX% of potential customers
- [Specific problem #2] costing businesses $XX billion annually
- [Specific problem #3] creating inefficiencies and frustration
- Limited solutions available, none addressing the complete problem

**Market Validation:**
Our extensive market research, including surveys of 500+ potential customers, confirms:
- 87% experience these problems regularly
- 93% would pay for an effective solution
- Current solutions are inadequate or overly complex
- Average cost of the problem: $XX,XXX per customer annually

## Our Solution

### Product Overview
${businessName} has developed a comprehensive solution that addresses these market needs through:

**Core Product Features:**
- [Feature #1]: Revolutionary approach that [specific benefit]
- [Feature #2]: Proprietary technology providing [competitive advantage]
- [Feature #3]: User-friendly interface reducing [specific pain point]
- [Feature #4]: Scalable platform supporting [growth capability]

**Unique Value Proposition:**
We are the only solution that combines [unique combination] to deliver:
- XX% reduction in [customer pain point]
- $XX,XXX average annual savings per customer
- Implementation time reduced from months to weeks
- ROI of XXX% within first year of use

### Technology and Intellectual Property
**Proprietary Technology:**
- [Patent #1]: [Description and competitive advantage]
- [Patent #2]: [Description and market protection]
- Trade secrets and know-how developed over X years
- Defensible technology moat with high barriers to entry

**Development Roadmap:**
- **Q1-Q2:** Enhanced analytics and reporting capabilities
- **Q3-Q4:** Mobile application and API integrations
- **Year 2:** AI-powered features and advanced automation
- **Year 3:** International expansion and enterprise features

## Market Opportunity

### Total Addressable Market (TAM)
**Market Size Analysis:**
- **TAM:** $XX billion globally (growing XX% annually)
- **SAM:** $XX billion serviceable addressable market
- **SOM:** $XXX million serviceable obtainable market (5-year target)

**Market Growth Drivers:**
- Increasing digitization across all industries
- Regulatory changes requiring [compliance/efficiency]
- Generational shift toward technology adoption
- Economic pressures driving cost optimization

### Target Customer Segments
**Primary Target Market:**
- **Segment:** [Customer type] with [specific characteristics]
- **Size:** XXX,XXX potential customers
- **Pain Points:** [Specific problems we solve]
- **Willingness to Pay:** $XX,XXX annually per customer

**Secondary Markets:**
- **Segment 2:** [Additional customer type]
- **Segment 3:** [Future expansion opportunity]

### Competitive Landscape
**Direct Competitors:**
- **Competitor A:** [Strengths/weaknesses, market share]
- **Competitor B:** [Positioning and differentiation]
- **Market Leader:** [Why we can capture share]

**Competitive Advantages:**
- First-mover advantage in [specific niche]
- Superior technology and user experience
- Strong brand recognition and customer loyalty
- Network effects and switching costs
- Intellectual property protection

## Business Model and Unit Economics

### Revenue Model
**Primary Revenue Streams:**
- **SaaS Subscriptions:** $XXX monthly per customer (80% of revenue)
- **Professional Services:** $XX,XXX implementation and consulting (15% of revenue)
- **Premium Features:** $XXX monthly upgrades (5% of revenue)

**Pricing Strategy:**
- **Starter Plan:** $XXX/month for small businesses
- **Professional Plan:** $XXX/month for mid-market
- **Enterprise Plan:** $X,XXX/month for large organizations
- **Custom Solutions:** Negotiated pricing for enterprise clients

### Unit Economics
**Customer Acquisition:**
- **Customer Acquisition Cost (CAC):** $XXX
- **Lifetime Value (LTV):** $X,XXX
- **LTV/CAC Ratio:** X.X (target: >3.0)
- **Payback Period:** X months

**Financial Metrics:**
- **Monthly Recurring Revenue (MRR):** $XXX,XXX
- **Annual Recurring Revenue (ARR):** $X,XXX,XXX
- **Gross Margin:** XX% (industry leading)
- **Churn Rate:** X% monthly (below industry average)

## Traction and Growth

### Customer Traction
**Current Customer Base:**
- **Total Customers:** XXX active customers
- **Revenue Growth:** XXX% quarter-over-quarter
- **Customer Retention:** XX% annual retention rate
- **Net Revenue Retention:** XXX% (expansion revenue)

**Customer Success Stories:**
- **Customer A:** Achieved XX% cost reduction and $XXX,XXX savings
- **Customer B:** Improved efficiency by XX% within first quarter
- **Customer C:** Scaled operations by XXX% using our platform

### Key Partnerships
**Strategic Partnerships:**
- **Partner A:** Distribution partnership accessing XXX,XXX customers
- **Partner B:** Technology integration expanding our capabilities
- **Partner C:** Channel partnership in international markets

### Market Validation
**Recognition and Awards:**
- [Industry Award] for innovation in [category]
- Featured in [Major Publication] as startup to watch
- Selected for [Accelerator Program] top 1% of applicants

## Financial Projections

### Revenue Projections (5-Year)
**Conservative Growth Scenario:**
- **Year 1:** $X,XXX,XXX revenue (XXX% growth)
- **Year 2:** $XX,XXX,XXX revenue (XXX% growth)
- **Year 3:** $XXX,XXX,XXX revenue (XXX% growth)
- **Year 4:** $XXX,XXX,XXX revenue (XXX% growth)
- **Year 5:** $XXX,XXX,XXX revenue (market leadership position)

### Profitability Timeline
**Path to Profitability:**
- **Break-even:** Month XX (within 18 months of funding)
- **Positive Cash Flow:** Month XX
- **EBITDA Positive:** Month XX
- **Target Margins:** XX% gross margin, XX% EBITDA margin by Year 3

### Use of Investment Funds
**${requestedAmount} Allocation:**

**Team and Talent (40% - ${(parseInt(requestedAmount.replace(/[^0-9]/g, '')) * 0.40).toLocaleString()}):**
- Engineering team expansion (10 developers)
- Sales and marketing team growth (15 professionals)
- Executive hires (VP Sales, VP Marketing, VP Engineering)
- Employee benefits and equity compensation

**Product Development (30% - ${(parseInt(requestedAmount.replace(/[^0-9]/g, '')) * 0.30).toLocaleString()}):**
- Core platform enhancements and new features
- Mobile application development
- AI and machine learning capabilities
- Third-party integrations and API development

**Sales and Marketing (25% - ${(parseInt(requestedAmount.replace(/[^0-9]/g, '')) * 0.25).toLocaleString()}):**
- Digital marketing and customer acquisition
- Sales team expansion and training
- Trade shows and industry events
- Content marketing and thought leadership

**Operations and Infrastructure (5% - ${(parseInt(requestedAmount.replace(/[^0-9]/g, '')) * 0.05).toLocaleString()}):**
- Technology infrastructure and security
- Legal and compliance costs
- Office expansion and equipment
- Working capital requirements

## Management Team

### Founding Team
**[Founder Name], CEO:**
- [X] years experience in [industry]
- Previously [previous role] at [Company]
- [Educational background]
- Track record of [specific achievements]

**[Co-founder Name], CTO:**
- [X] years technology leadership experience
- Former [role] at [Company]
- [Technical expertise and achievements]
- [Patents/publications/recognitions]

### Advisory Board
**[Advisor Name]:** Former CEO of [Company], expert in [area]
**[Advisor Name]:** Industry veteran with [specific expertise]
**[Advisor Name]:** Successful entrepreneur and investor

### Key Hires Planned
- **VP of Sales:** Proven enterprise sales leader
- **VP of Marketing:** Growth marketing expert
- **VP of Engineering:** Scalable technology architecture
- **CFO:** Experienced in high-growth SaaS companies

## Investment Terms and Exit Strategy

### Investment Structure
**Current Round:**
- **Amount:** ${requestedAmount}
- **Security Type:** Series A Preferred Stock
- **Pre-money Valuation:** $5,000,000
- **Post-money Valuation:** $5,500,000
- **Investor Ownership:** X% (depending on final terms)

### Investor Rights
- Board seat or board observer rights
- Pro-rata rights in future rounds
- Anti-dilution protection
- Information rights and regular reporting

### Exit Strategy
**Potential Exit Scenarios:**
- **Strategic Acquisition:** Target acquirers include [Company A], [Company B], [Company C]
- **IPO:** Potential public offering in 5-7 years
- **Private Equity:** Management buyout or PE acquisition

**Comparable Transactions:**
- [Company A] acquired for $XXX million (XX.X revenue multiple)
- [Company B] IPO at $X.X billion valuation
- [Company C] strategic sale for $XXX million

### Return Projections
**Conservative Exit Scenarios:**
- **3x Return:** Strategic acquisition in Year 3-4
- **5x Return:** IPO scenario in Year 5-6
- **10x+ Return:** Market leadership and premium valuation

## Risk Factors and Mitigation

### Key Risks
**Market Risk:** Market adoption slower than projected
- *Mitigation:* Conservative projections and flexible business model

**Competitive Risk:** Large players entering the market
- *Mitigation:* Strong IP protection and first-mover advantages

**Technology Risk:** Technical challenges or security issues
- *Mitigation:* Experienced team and robust development practices

**Execution Risk:** Inability to scale operations effectively
- *Mitigation:* Proven leadership team and scalable systems

### Risk Management
- Regular board meetings and investor updates
- Quarterly business reviews and strategy adjustments
- Strong internal controls and compliance procedures
- Comprehensive insurance coverage

## Call to Action

### Why Invest Now
This represents a unique opportunity to:
- **Enter Early:** Ground floor opportunity in rapidly growing market
- **Partner with Winners:** Proven team with track record of success
- **Capture Large Market:** Significant TAM with clear path to leadership
- **Generate Strong Returns:** Multiple exit scenarios with attractive returns

### Next Steps
**Due Diligence Process:**
1. **Initial Interest:** Sign NDA and receive detailed data room access
2. **Management Presentations:** Deep dive sessions with key team members
3. **Customer References:** Speak with satisfied customers and partners
4. **Technical Review:** Product demonstration and architecture review
5. **Term Sheet:** Negotiate investment terms and structure

### Timeline
- **Week 1-2:** Due diligence and term sheet negotiation
- **Week 3-4:** Legal documentation and closing
- **Month 1:** Board formation and strategic planning
- **Ongoing:** Regular updates and milestone tracking

---

**Investment Opportunity Summary:**
**Company:** ${businessName}
**Investment Amount:** ${requestedAmount}
**Use of Funds:** Growth acceleration and market expansion
**Expected Return:** 5-10x over 5-7 years
**Contact:** [Founder Name], CEO

**Contact Information:**
**Email:** [founder@yourbusiness.com]
**Phone:** [555-123-4567]
**Website:** [www.yourbusiness.com]
**Address:** [Company Address]

---

*This investment opportunity is available to accredited investors only. All financial projections are estimates based on current market conditions and business performance.*`;

        } else {
          // General Loan Application
          mockContent = `# Loan Application
## ${businessName}

---

**Application Date:** ${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Requested Loan Amount:** ${requestedAmount}
**Loan Purpose:** Business Development and Working Capital
**Applicant:** ${businessName}

---

## Executive Summary

${businessName} respectfully submits this loan application requesting ${requestedAmount} to support our business development initiatives and working capital needs. Our established business demonstrates consistent growth, strong financial management, and a clear plan for utilizing the requested funds to generate additional revenue and ensure timely loan repayment.

**Application Highlights:**
• Established business with consistent revenue growth
• Strong financial position and creditworthiness
• Clear business plan with measurable objectives
• Comprehensive repayment strategy
• Experienced management team

## Business Overview

### Company Information
**Business Details:**
- **Legal Name:** ${businessName}
- **Business Type:** [Corporation/LLC/Partnership]
- **Years in Operation:** [X] years
- **Federal Tax ID:** [XX-XXXXXXX]
- **Industry:** [Primary business sector]

### Business Description
${businessName} operates as a [business description] serving [target market] in the [geographic area] market. Our business model focuses on [core value proposition] and has demonstrated consistent growth and profitability over the past [X] years.

**Core Business Activities:**
- [Primary service/product offering]
- [Secondary revenue streams]
- [Additional business activities]

### Management Team
**Key Personnel:**
- **[Name], Owner/President:** [X] years experience in [industry]
- **[Name], Operations Manager:** [Background and qualifications]
- **[Name], Financial Manager:** [Relevant experience]

## Financial Information

### Current Financial Position
**Annual Revenue (Last 3 Years):**
- Year 1: $[XXX,XXX]
- Year 2: $[XXX,XXX] ([X]% growth)
- Year 3: $[XXX,XXX] ([X]% growth)

**Profitability Analysis:**
- Gross Profit Margin: [X]%
- Net Profit Margin: [X]%
- Average Monthly Revenue: $[XX,XXX]
- Average Monthly Expenses: $[XX,XXX]

### Balance Sheet Summary
**Assets:**
- Cash and Cash Equivalents: $[XX,XXX]
- Accounts Receivable: $[XX,XXX]
- Inventory: $[XX,XXX]
- Equipment and Property: $[XXX,XXX]
- **Total Assets:** $[XXX,XXX]

**Liabilities:**
- Accounts Payable: $[XX,XXX]
- Short-term Debt: $[XX,XXX]
- Long-term Debt: $[XX,XXX]
- **Total Liabilities:** $[XXX,XXX]

**Owner's Equity:** $[XXX,XXX]

### Cash Flow Analysis
**Monthly Cash Flow:**
- Average Monthly Income: $[XX,XXX]
- Average Monthly Expenses: $[XX,XXX]
- Net Monthly Cash Flow: $[XX,XXX]
- Debt Service Capability: $[XX,XXX]

## Loan Request Details

### Purpose of Loan
The requested ${requestedAmount} will be used for the following purposes:

**Working Capital (50% - ${(parseInt(requestedAmount.replace(/[^0-9]/g, '')) * 0.50).toLocaleString()}):**
- Inventory purchases and management
- Accounts receivable financing
- Operational cash flow support
- Seasonal business fluctuations

**Business Development (30% - ${(parseInt(requestedAmount.replace(/[^0-9]/g, '')) * 0.30).toLocaleString()}):**
- Marketing and advertising campaigns
- Customer acquisition initiatives
- Product development and improvement
- Market expansion activities

**Equipment and Infrastructure (20% - ${(parseInt(requestedAmount.replace(/[^0-9]/g, '')) * 0.20).toLocaleString()}):**
- Equipment purchases and upgrades
- Technology improvements
- Facility improvements
- Vehicle or transportation needs

### Proposed Loan Terms
**Requested Terms:**
- Loan Amount: ${requestedAmount}
- Proposed Term: [3-5] years
- Preferred Payment Structure: Monthly payments
- Collateral: [Business assets and/or personal guarantees]

### Repayment Plan
**Repayment Strategy:**
Our repayment plan is based on conservative projections of business cash flow:

- **Primary Source:** Operating cash flow from business operations
- **Monthly Payment Capacity:** $[X,XXX] (based on current cash flow)
- **Debt Service Coverage:** [X.X] times coverage ratio
- **Secondary Sources:** Asset liquidation if necessary

**Financial Projections:**
- Year 1 Projected Revenue: $[XXX,XXX] ([X]% growth)
- Year 2 Projected Revenue: $[XXX,XXX] ([X]% growth)
- Year 3 Projected Revenue: $[XXX,XXX] ([X]% growth)

## Collateral and Security

### Available Collateral
**Business Assets:**
- Real Estate: $[XXX,XXX] estimated value
- Equipment: $[XX,XXX] current market value
- Inventory: $[XX,XXX] average value
- Accounts Receivable: $[XX,XXX] outstanding

### Personal Guarantees
The business owner(s) are prepared to provide personal guarantees for the loan, including:
- Personal financial statements
- Credit history and references
- Asset documentation
- Income verification

### Insurance Coverage
**Current Insurance Policies:**
- General Liability: $[X,XXX,XXX] coverage
- Property Insurance: $[XXX,XXX] coverage
- Business Interruption: $[XXX,XXX] coverage
- Key Person Insurance: $[XXX,XXX] coverage

## Business Plan and Growth Strategy

### Market Analysis
**Industry Overview:**
- Market size and growth trends
- Competitive landscape analysis
- Customer demand patterns
- Economic factors affecting business

### Competitive Position
**Competitive Advantages:**
- [Unique selling proposition]
- [Customer relationships and loyalty]
- [Operational efficiencies]
- [Market positioning]

### Growth Strategy
**Business Development Plan:**
- **Short-term (1 year):** [Specific goals and initiatives]
- **Medium-term (2-3 years):** [Expansion and development plans]
- **Long-term (3+ years):** [Strategic objectives]

**Marketing and Sales:**
- Customer acquisition strategies
- Marketing channels and campaigns
- Sales process improvements
- Customer retention programs

## Risk Assessment and Management

### Business Risks
**Identified Risks:**
- **Market Risk:** Economic downturns or industry changes
  - *Mitigation:* Diversified revenue streams and flexible operations

- **Operational Risk:** Key person dependency or operational disruptions
  - *Mitigation:* Cross-training and operational redundancy

- **Financial Risk:** Cash flow fluctuations or collection issues
  - *Mitigation:* Conservative financial planning and collection procedures

### Risk Management Strategies
- Regular financial monitoring and reporting
- Contingency planning for various scenarios
- Insurance coverage for major risks
- Professional advisory support

## Professional References

### Banking Relationships
- **Primary Bank:** [Bank Name and relationship length]
- **Account History:** [Payment history and standing]
- **Credit Facilities:** [Existing credit lines and usage]

### Professional Advisors
- **Accountant/CPA:** [Name, Firm, Contact Information]
- **Attorney:** [Name, Firm, Contact Information]
- **Insurance Agent:** [Name, Company, Contact Information]
- **Business Advisor:** [Name and relationship]

### Trade References
- **Supplier A:** [Company name, contact, payment history]
- **Supplier B:** [Company name, contact, payment history]
- **Supplier C:** [Company name, contact, payment history]

## Legal and Regulatory Compliance

### Business Compliance
- All business licenses current and in good standing
- Tax obligations current with no outstanding issues
- Regulatory compliance maintained
- Employment law compliance

### Legal Documentation
- Corporate formation documents
- Operating agreements
- Major contracts and agreements
- Intellectual property registrations

## Conclusion

${businessName} presents a strong loan opportunity with:

✓ **Proven Business Performance** - Consistent revenue growth and profitability
✓ **Strong Financial Position** - Healthy balance sheet and cash flow
✓ **Clear Loan Purpose** - Specific use of funds for business growth
✓ **Solid Repayment Plan** - Conservative projections and multiple repayment sources
✓ **Adequate Collateral** - Business assets and personal guarantees

### Our Commitment
We are committed to:
- Responsible use of loan proceeds
- Timely repayment according to agreed terms
- Transparent communication and reporting
- Maintaining strong business performance

We respectfully request your consideration of our loan application and welcome the opportunity to discuss this request in detail.

---

**Application Summary:**
**Applicant:** ${businessName}
**Requested Amount:** ${requestedAmount}
**Purpose:** Business development and working capital
**Proposed Term:** [3-5] years

**Primary Contact:**
**Name:** [Business Owner]
**Title:** [Owner/President]
**Phone:** [555-123-4567]
**Email:** [owner@yourbusiness.com]
**Address:** [Business Address]

---

**Supporting Documentation Attached:**
- Business financial statements (3 years)
- Personal financial statements
- Business and personal tax returns
- Bank statements (12 months)
- Business plan and projections
- Legal documents and licenses
- Insurance certificates
- Reference letters`;
        }
      }

      setGeneratedProposal({
        content: mockContent,
        metadata: {
          proposalType: selectedProposalType,
          grant: selectedProposalType === 'grant_match' ? selectedGrant : null,
          generatedAt: new Date().toISOString(),
          wordCount: mockContent.split(' ').length
        },
        proposalType: selectedProposalType,
        grant: selectedProposalType === 'grant_match' ? selectedGrant : null,
        businessPlan: selectedSource === 'upload' ? uploadedFile.name : selectedBusinessPlan?.title
      });

    } catch (error) {
      console.error('Generation error:', error);
      setGenerationError('An error occurred while generating the proposal');
    } finally {
      setIsGenerating(false);
    }
  };

  const extractPDFContent = async (file) => {
    // This would integrate with a PDF extraction service
    // For now, return placeholder
    return `Content extracted from ${file.name}`;
  };

  const handleDownload = () => {
    if (generatedProposal?.content) {
      try {
        // Create PDF document
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const lineHeight = 7;
        const maxLineWidth = pageWidth - 2 * margin;

        // Add header
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');

        let title;
        if (selectedProposalType === 'grant_match' && selectedGrant) {
          title = `Grant Proposal: ${selectedGrant.title}`;
        } else {
          title = PROPOSAL_TYPES[selectedProposalType].label;
        }

        // Center the title
        const titleWidth = pdf.getStringUnitWidth(title) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
        const titleX = (pageWidth - titleWidth) / 2;
        pdf.text(title, titleX, 30);

        // Add date and metadata
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 45);

        if (selectedProposalType === 'grant_match' && selectedGrant) {
          pdf.text(`Agency: ${selectedGrant.agency}`, margin, 52);
          pdf.text(`Amount: ${selectedGrant.amount}`, margin, 59);
        }

        // Process content
        const content = generatedProposal.content;
        const lines = content.split('\n');

        let yPosition = 75;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          if (line === '') {
            yPosition += lineHeight / 2;
            continue;
          }

          // Check for headers (lines starting with #)
          if (line.startsWith('#')) {
            // Add some space before headers
            yPosition += lineHeight;

            if (yPosition > pageHeight - 30) {
              pdf.addPage();
              yPosition = 30;
            }

            const headerText = line.replace(/#+\s*/, '');
            const headerLevel = (line.match(/^#+/) || [''])[0].length;

            if (headerLevel === 1) {
              pdf.setFontSize(16);
              pdf.setFont('helvetica', 'bold');
            } else {
              pdf.setFontSize(14);
              pdf.setFont('helvetica', 'bold');
            }

            pdf.text(headerText, margin, yPosition);
            yPosition += lineHeight * 1.5;
          } else {
            // Regular text
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'normal');

            // Handle line wrapping
            const wrappedLines = pdf.splitTextToSize(line, maxLineWidth);

            for (let j = 0; j < wrappedLines.length; j++) {
              if (yPosition > pageHeight - 30) {
                pdf.addPage();
                yPosition = 30;
              }

              pdf.text(wrappedLines[j], margin, yPosition);
              yPosition += lineHeight;
            }
          }

          // Add extra space after paragraphs
          if (i < lines.length - 1 && lines[i + 1].trim() === '') {
            yPosition += lineHeight / 2;
          }
        }

        // Add footer with page numbers
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.text(
            `Page ${i} of ${pageCount}`,
            pageWidth - margin - 30,
            pageHeight - 10
          );

          // Add footer line
          pdf.text(
            'Generated by PlanPilot AI',
            margin,
            pageHeight - 10
          );
        }

        // Generate filename
        let filename;
        if (selectedProposalType === 'grant_match' && selectedGrant) {
          filename = `${selectedGrant.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_Grant_Proposal.pdf`;
        } else {
          filename = `${PROPOSAL_TYPES[selectedProposalType].label.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_Proposal.pdf`;
        }

        // Download the PDF
        pdf.save(filename);

      } catch (error) {
        console.error('PDF generation error:', error);
        // Fallback to text download
        const blob = new Blob([generatedProposal.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'proposal.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  };

  const resetWorkflow = () => {
    setCurrentStep(1);
    setSelectedSource(null);
    setUploadedFile(null);
    setSelectedBusinessPlan(null);
    setSelectedProposalType(null);
    setSelectedGrant(null);
    setGeneratedProposal(null);
    setGenerationError('');
  };

  if (!canCreateProposals) {
    return <UpgradePrompt feature="Grant Proposal Generation" />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Grant Proposal Generator</h1>
        <p className="text-muted-foreground">
          Generate professional proposals from your business plans for grants, loans, and investor pitches.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {step}
              </div>
              {index < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  currentStep > step ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-sm text-muted-foreground text-center">
          {currentStep === 1 && "Choose your business plan source"}
          {currentStep === 2 && "Select proposal type"}
          {currentStep === 3 && "Select target grant (if applicable)"}
          {currentStep === 4 && "Generate your proposal"}
        </div>
      </div>

      {/* Step 1: Choose Business Plan Source */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Step 1: Choose Your Business Plan Source
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Upload PDF Option */}
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Upload PDF Business Plan</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload an external PDF business plan document
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors ${
                    selectedSource === 'upload'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Choose PDF File
                </label>
                {uploadedFile && (
                  <div className="mt-3 text-sm text-foreground">
                    Selected: {uploadedFile.name}
                  </div>
                )}
              </div>

              {/* Saved Business Plans Option */}
              <div className="border-2 border-border rounded-lg p-6">
                <div className="text-center mb-4">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Choose from Saved Business Plans</h3>
                  <p className="text-sm text-muted-foreground">
                    Select from business plans you've created in the app
                  </p>
                </div>

                {loadingBusinessPlans ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading business plans...</p>
                  </div>
                ) : savedBusinessPlans.length > 0 ? (
                  <div className="relative">
                    <select
                      value={selectedBusinessPlan?.id || ''}
                      onChange={(e) => {
                        const plan = savedBusinessPlans.find(p => p.id === e.target.value);
                        if (plan) handleSavedPlanSelect(plan);
                      }}
                      className="w-full p-3 border border-border rounded-lg bg-background text-foreground appearance-none cursor-pointer"
                    >
                      <option value="">Select a business plan...</option>
                      {savedBusinessPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.title} - {new Date(plan.created_at).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      No saved business plans found.{' '}
                      <a href="/business-plans" className="text-primary hover:underline">
                        Create one first
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Continue Button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!canProceedToStep(2)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue to Proposal Type Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Select Proposal Type */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Award className="h-5 w-5" />
              Step 2: Select Proposal Type
            </h2>
            <p className="text-muted-foreground mb-6">
              Choose the type of proposal you want to generate from your business plan.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(PROPOSAL_TYPES).map(([key, type]) => (
                <button
                  key={key}
                  onClick={() => handleProposalTypeSelect(key)}
                  className={`p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50 ${
                    selectedProposalType === key
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`${type.color} text-white p-2 rounded-lg`}>
                      {type.icon}
                    </div>
                    <h3 className="font-medium text-foreground">{type.label}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </button>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep(selectedProposalType === 'grant_match' ? 3 : 4)}
                disabled={!canProceedToStep(3)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {selectedProposalType === 'grant_match' ? 'Continue to Grant Selection' : 'Generate Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Grant Selection (only for grant_match) */}
      {currentStep === 3 && selectedProposalType === 'grant_match' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Award className="h-5 w-5" />
              Step 3: Select Target Grant
            </h2>
            <p className="text-muted-foreground mb-6">
              Choose a grant that matches your business plan for a tailored proposal.
            </p>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search grants by title, agency, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground"
              />
            </div>

            {/* Grants List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredGrants.map((grant) => (
                <button
                  key={grant.id}
                  onClick={() => setSelectedGrant(grant)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedGrant?.id === grant.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-foreground">{grant.title}</h3>
                    <span className="text-sm font-medium text-primary">{grant.amount}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{grant.agency}</p>
                  <p className="text-sm text-muted-foreground mb-3">{grant.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Deadline: {grant.deadline}
                    </div>
                    <div className="flex gap-1">
                      {grant.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                disabled={!selectedGrant}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Generate Grant Proposal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Generate Proposal */}
      {currentStep === 4 && (
        <div className="space-y-6">
          {!generatedProposal && !isGenerating && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Step 4: Generate Your Proposal</h2>

              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-foreground mb-3">Proposal Summary</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Business Plan:</span>{' '}
                    <span className="text-foreground">
                      {selectedSource === 'upload' ? uploadedFile?.name : selectedBusinessPlan?.title}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Proposal Type:</span>{' '}
                    <span className="text-foreground">{PROPOSAL_TYPES[selectedProposalType]?.label}</span>
                  </div>
                  {selectedProposalType === 'grant_match' && selectedGrant && (
                    <div>
                      <span className="text-muted-foreground">Target Grant:</span>{' '}
                      <span className="text-foreground">{selectedGrant.title}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(selectedProposalType === 'grant_match' ? 3 : 2)}
                  className="px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerateProposal}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Generate Proposal
                </button>
              </div>

              {generationError && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {generationError}
                </div>
              )}
            </div>
          )}

          {/* Generating State */}
          {isGenerating && (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Generating Your Proposal</h2>
              <p className="text-muted-foreground">
                Creating a tailored {PROPOSAL_TYPES[selectedProposalType]?.label.toLowerCase()}...
              </p>
            </div>
          )}

          {/* Generated Proposal */}
          {generatedProposal && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Generated Proposal</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button
                    onClick={resetWorkflow}
                    className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                  >
                    Create Another
                  </button>
                </div>
              </div>

              {/* Proposal Content */}
              <div className="bg-background border border-border rounded-lg p-6 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                  {generatedProposal.content}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}