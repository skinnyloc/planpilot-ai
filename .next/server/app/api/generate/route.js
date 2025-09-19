(()=>{var a={};a.id=5435,a.ids=[5435],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11997:a=>{"use strict";a.exports=require("punycode")},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},23689:(a,b,c)=>{"use strict";c.d(b,{supabase:()=>g});var d=c(82461);let e=(void 0).VITE_SUPABASE_URL||"https://rultnsioetsnlpgjasmt.supabase.co",f=(void 0).VITE_SUPABASE_ANON_KEY||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bHRuc2lvZXRzbmxwZ2phc210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTc4NTYsImV4cCI6MjA3MjUzMzg1Nn0.wU40BvwUBZYYEjPiruZEC9zYWmhdXgkQvhjHz1D5K_4",g=(0,d.UU)(e,f)},27910:a=>{"use strict";a.exports=require("stream")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},54097:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>T,patchFetch:()=>S,routeModule:()=>O,serverHooks:()=>R,workAsyncStorage:()=>P,workUnitAsyncStorage:()=>Q});var d={};c.r(d);var e={};c.r(e);var f={};c.r(f),c.d(f,{GET:()=>M,OPTIONS:()=>N,POST:()=>I});var g=c(95736),h=c(9117),i=c(4044),j=c(39326),k=c(32324),l=c(261),m=c(54290),n=c(85328),o=c(38928),p=c(46595),q=c(3421),r=c(17679),s=c(41681),t=c(63446),u=c(86439),v=c(51356),w=c(10641),x=c(15164),y=c(23689);class z{constructor(){this.apiKey=(void 0).VITE_OPENAI_API_KEY||localStorage.getItem("openai_api_key"),this.baseURL="https://api.openai.com/v1",this.apiKey||console.warn("OpenAI API key not found. Looking for VITE_OPENAI_API_KEY or fallback options.")}getApiKey(){return(void 0).VITE_OPENAI_API_KEY?(void 0).VITE_OPENAI_API_KEY:localStorage.getItem("openai_api_key")?localStorage.getItem("openai_api_key"):null}async generateContent({prompt:a,model:b="gpt-3.5-turbo",maxTokens:c=3500,temperature:d=.7}){let e=this.getApiKey();if(console.log("OpenAI Client Debug:",{hasApiKey:!!e,apiKeyPrefix:e?e.substring(0,10)+"...":"none",promptLength:a?.length,model:b}),!e){let a="OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your environment or configure the key properly.";throw console.error(a),Error(a)}if(!a||0===a.trim().length){let a="Prompt is required and cannot be empty";throw console.error(a),Error(a)}try{let f=await fetch(`${this.baseURL}/chat/completions`,{method:"POST",headers:{Authorization:`Bearer ${e}`,"Content-Type":"application/json"},body:JSON.stringify({model:b,messages:[{role:"system",content:"You are an expert business consultant and writer. Generate professional, detailed, and actionable business content. Focus on practical insights, market analysis, and strategic recommendations. Use proper business terminology and structure your responses clearly with headings and bullet points where appropriate."},{role:"user",content:a}],max_tokens:c,temperature:d})});if(!f.ok){let a=await f.json().catch(()=>({}));if(401===f.status)throw Error("Invalid OpenAI API key. Please check your API key configuration.");if(429===f.status)throw Error("OpenAI API rate limit exceeded. Please try again in a moment.");if(402===f.status)throw Error("OpenAI API quota exceeded. Please check your billing.");throw Error(a.error?.message||`OpenAI API error: ${f.status} ${f.statusText}`)}let g=await f.json();if(!g.choices||0===g.choices.length)throw Error("No content generated from OpenAI");let h=g.choices[0].message.content;return{success:!0,content:h,usage:g.usage,model:g.model}}catch(a){throw console.error("OpenAI generation error details:",{message:a.message,stack:a.stack,name:a.name}),a}}async testConnection(){let a=this.getApiKey();if(!a)throw Error("OpenAI API key not found");try{return(await fetch(`${this.baseURL}/models`,{headers:{Authorization:`Bearer ${a}`}})).ok}catch(a){return console.error("OpenAI connection test failed:",a),!1}}}new z;let A={BUSINESS_PLAN:"business_plan",GRANT_PROPOSAL:"grant_proposal",PITCH_DECK:"pitch_deck",MARKET_ANALYSIS:"market_analysis",FINANCIAL_PLAN:"financial_plan",EXECUTIVE_SUMMARY:"executive_summary",SWOT_ANALYSIS:"swot_analysis",COMPETITIVE_ANALYSIS:"competitive_analysis"},B={SBIR:"sbir",SBA:"sba",RESEARCH:"research",INNOVATION:"innovation",MINORITY_BUSINESS:"minority_business",WOMEN_BUSINESS:"women_business",TECHNOLOGY:"technology",ENVIRONMENTAL:"environmental",EDUCATION:"education",HEALTHCARE:"healthcare"},C={type:A.BUSINESS_PLAN,name:"Comprehensive Business Plan",description:"A complete business plan with all essential sections",estimatedTokens:3500,sections:["Executive Summary","Company Description","Market Analysis","Organization & Management","Marketing & Sales Strategy","Operations Plan","Financial Projections","Risk Analysis"],buildPrompt:({businessName:a,businessIdea:b,industry:c,targetMarket:d,businessModel:e,competitiveAdvantage:f,fundingNeeds:g,timeframe:h="3 years"})=>`Create a comprehensive business plan for: ${a||"the specified business"}

BUSINESS DETAILS:
- Business Idea: ${b}
- Industry: ${c||"To be determined"}
- Target Market: ${d||"To be analyzed"}
- Business Model: ${e||"To be developed"}
- Competitive Advantage: ${f||"To be identified"}
- Funding Needs: ${g||"To be calculated"}
- Planning Timeframe: ${h}

Please create a detailed business plan with the following structure:

## 1. EXECUTIVE SUMMARY
- Business concept and value proposition
- Mission and vision statements
- Key success factors and milestones
- Financial highlights and funding requirements
- Management team overview

## 2. COMPANY DESCRIPTION
- Company history and legal structure
- Location and facilities requirements
- Products/services detailed description
- Unique selling propositions
- Competitive advantages

## 3. MARKET ANALYSIS
- Industry overview and trends
- Target market segmentation
- Market size and growth projections
- Customer needs analysis
- Market entry strategy

## 4. COMPETITIVE ANALYSIS
- Direct and indirect competitors
- Competitive positioning matrix
- SWOT analysis
- Barriers to entry
- Competitive response strategies

## 5. MARKETING & SALES STRATEGY
- Brand positioning and messaging
- Marketing channels and tactics
- Sales process and strategy
- Pricing strategy and rationale
- Customer acquisition and retention

## 6. OPERATIONS PLAN
- Production/service delivery process
- Technology requirements
- Quality control measures
- Supply chain management
- Scalability considerations

## 7. MANAGEMENT & ORGANIZATION
- Organizational structure
- Key personnel requirements
- Advisory board composition
- Hiring and training plans
- Compensation strategy

## 8. FINANCIAL PROJECTIONS
- Revenue model and assumptions
- 3-year income statement projections
- Cash flow projections
- Break-even analysis
- Funding requirements and use of funds

## 9. RISK ANALYSIS & MITIGATION
- Market and competitive risks
- Operational and financial risks
- Regulatory and compliance risks
- Risk mitigation strategies
- Contingency planning

## 10. IMPLEMENTATION TIMELINE
- Phase-by-phase implementation plan
- Key milestones and deadlines
- Resource allocation timeline
- Performance metrics and KPIs
- Exit strategy considerations

Provide specific, actionable insights and realistic projections. Use professional business language and include relevant industry benchmarks where possible.`,getParameters(){return[{name:"businessName",type:"text",required:!1,label:"Business Name"},{name:"businessIdea",type:"textarea",required:!0,label:"Business Idea Description"},{name:"industry",type:"select",required:!1,label:"Industry",options:this.getIndustryOptions()},{name:"targetMarket",type:"textarea",required:!1,label:"Target Market Description"},{name:"businessModel",type:"textarea",required:!1,label:"Business Model"},{name:"competitiveAdvantage",type:"textarea",required:!1,label:"Competitive Advantage"},{name:"fundingNeeds",type:"text",required:!1,label:"Estimated Funding Needs"},{name:"timeframe",type:"select",required:!1,label:"Planning Timeframe",options:["1 year","3 years","5 years"],default:"3 years"}]},getIndustryOptions:()=>["Technology","Healthcare","Finance","Retail","Manufacturing","Education","Real Estate","Food & Beverage","Transportation","Energy","Entertainment","Agriculture","Construction","Other"]},D={[B.SBIR]:{type:A.GRANT_PROPOSAL,name:"SBIR Grant Proposal",description:"Small Business Innovation Research grant proposal",estimatedTokens:3e3,buildPrompt:({projectTitle:a,businessDescription:b,technicalInnovation:c,commercialization:d,fundingAmount:e,projectDuration:f,phase:g="Phase I"})=>`Create an SBIR ${g} grant proposal for the following project:

PROJECT DETAILS:
- Project Title: ${a}
- Business: ${b}
- Technical Innovation: ${c}
- Commercialization Plan: ${d||"To be developed"}
- Funding Amount: ${e}
- Project Duration: ${f||"6-24 months"}

Structure the proposal according to SBIR requirements:

## 1. PROJECT SUMMARY
- Technical innovation overview
- Commercial potential summary
- Key objectives and deliverables
- Anticipated benefits

## 2. RESEARCH & DEVELOPMENT PLAN
- Technical objectives and approach
- Innovation and technical merit
- Research methodology
- Risk assessment and mitigation

## 3. COMMERCIAL POTENTIAL
- Market opportunity analysis
- Commercialization strategy
- Competitive advantages
- Revenue projections

## 4. COMPANY CAPABILITIES
- Technical expertise and experience
- Facilities and equipment
- Key personnel qualifications
- Past performance record

## 5. BUDGET JUSTIFICATION
- Detailed cost breakdown
- Personnel costs
- Equipment and supplies
- Indirect costs

## 6. TIMELINE AND MILESTONES
- Project phases and timeline
- Key deliverables and milestones
- Performance metrics
- Go/no-go decision points

Emphasize innovation, technical feasibility, and strong commercial potential.`},[B.SBA]:{type:A.GRANT_PROPOSAL,name:"SBA Grant Proposal",description:"Small Business Administration grant proposal",estimatedTokens:2500,buildPrompt:({businessName:a,businessDescription:b,projectDescription:c,communityImpact:d,fundingAmount:e,businessStage:f})=>`Create an SBA grant proposal for the following business:

BUSINESS INFORMATION:
- Business Name: ${a}
- Business Description: ${b}
- Project Description: ${c}
- Community Impact: ${d||"To be detailed"}
- Funding Amount: ${e}
- Business Stage: ${f||"Startup"}

Structure the proposal to meet SBA requirements:

## 1. EXECUTIVE SUMMARY
- Business and project overview
- Funding request and use
- Expected outcomes and impact
- Key qualifications

## 2. BUSINESS DESCRIPTION
- Company background and history
- Products/services offered
- Market opportunity
- Competitive position

## 3. PROJECT DESCRIPTION
- Project goals and objectives
- Implementation plan
- Timeline and milestones
- Success metrics

## 4. COMMUNITY IMPACT
- Job creation potential
- Economic development impact
- Community benefit analysis
- Social responsibility aspects

## 5. FINANCIAL INFORMATION
- Current financial position
- Projected financial performance
- Funding sources and uses
- Return on investment

## 6. MANAGEMENT TEAM
- Key personnel backgrounds
- Relevant experience
- Advisory support
- Organizational structure

Focus on job creation, economic impact, and community benefit.`}},E={type:A.PITCH_DECK,name:"Investment Pitch Deck",description:"Investor presentation with key business highlights",estimatedTokens:2e3,buildPrompt:({businessName:a,problemStatement:b,solution:c,marketSize:d,businessModel:e,traction:f,funding:g,teamInfo:h})=>`Create content for an investor pitch deck presentation:

BUSINESS OVERVIEW:
- Company: ${a}
- Problem: ${b}
- Solution: ${c}
- Market Size: ${d||"To be researched"}
- Business Model: ${e||"To be defined"}
- Traction: ${f||"Early stage"}
- Funding Sought: ${g}
- Team: ${h||"Founding team"}

Generate compelling content for each slide:

## SLIDE 1: COMPANY OVERVIEW
- Company name and tagline
- Mission statement
- What you do in one sentence

## SLIDE 2: PROBLEM
- Clear problem definition
- Market pain points
- Problem validation
- Target customer challenges

## SLIDE 3: SOLUTION
- Your unique solution
- Key features and benefits
- Why now?
- Solution differentiation

## SLIDE 4: MARKET OPPORTUNITY
- Total Addressable Market (TAM)
- Serviceable Addressable Market (SAM)
- Market trends and growth
- Customer segments

## SLIDE 5: BUSINESS MODEL
- Revenue streams
- Pricing strategy
- Unit economics
- Scalability factors

## SLIDE 6: TRACTION
- Key metrics and milestones
- Customer testimonials
- Revenue growth
- Market validation

## SLIDE 7: COMPETITIVE LANDSCAPE
- Direct and indirect competitors
- Competitive advantages
- Market positioning
- Barriers to entry

## SLIDE 8: MARKETING STRATEGY
- Customer acquisition strategy
- Marketing channels
- Partnership opportunities
- Go-to-market plan

## SLIDE 9: FINANCIAL PROJECTIONS
- Revenue projections (3-5 years)
- Key assumptions
- Path to profitability
- Unit economics

## SLIDE 10: TEAM
- Founder backgrounds
- Key team members
- Advisory board
- Why this team?

## SLIDE 11: FUNDING
- Funding amount and use
- Previous funding rounds
- Investor returns
- Exit strategy

## SLIDE 12: NEXT STEPS
- Call to action
- Contact information
- Follow-up process

Make each slide content concise, compelling, and investor-focused.`},F={[A.BUSINESS_PLAN]:C,[A.GRANT_PROPOSAL]:D,[A.PITCH_DECK]:E};class G{static getTemplate(a,b=null){return a===A.GRANT_PROPOSAL&&b?D[b]:F[a]}static getAllTemplates(){let a=[];return a.push({id:A.BUSINESS_PLAN,...C}),Object.keys(D).forEach(b=>{a.push({id:`${A.GRANT_PROPOSAL}_${b}`,grantType:b,...D[b]})}),a.push({id:A.PITCH_DECK,...E}),a}static validateParameters(a,b){let c=this.getTemplate(a);if(!c||!c.getParameters)return{valid:!0,errors:[]};let d=c.getParameters().filter(a=>a.required),e=[];return d.forEach(a=>{b[a.name]&&""!==b[a.name].trim()||e.push(`${a.label} is required`)}),{valid:0===e.length,errors:e}}static getGrantTemplate(a){return D[a]}static estimateTokens(a){let b=this.getTemplate(a);return b?.estimatedTokens||2e3}}class H{static formatContent(a,b){let c=a;switch(c=(c=(c=(c=c.replace(/##\s/g,"\n## ")).replace(/###\s/g,"\n### ")).replace(/\n\n\n+/g,"\n\n")).trim(),b){case A.BUSINESS_PLAN:c=this.formatBusinessPlan(c);break;case A.GRANT_PROPOSAL:c=this.formatGrantProposal(c);break;case A.PITCH_DECK:c=this.formatPitchDeck(c)}return c}static formatBusinessPlan(a){let b=this.generateTableOfContents(a);return`# Business Plan

## Table of Contents
${b}

${a}`}static formatGrantProposal(a){return`# Grant Proposal

**Submitted to:** [Grant Agency]
**Date:** ${new Date().toLocaleDateString()}
**Prepared by:** [Organization Name]

---

`+a}static formatPitchDeck(a){return a.replace(/## SLIDE \d+:/g,"\n---\n\n$&")}static generateTableOfContents(a){return(a.match(/^## .+$/gm)||[]).map((a,b)=>{let c=a.replace("## ","");return`${b+1}. ${c}`}).join("\n")}static extractMetrics(a){return{wordCount:a.split(/\s+/).length,characterCount:a.length,sectionCount:(a.match(/^## /gm)||[]).length,estimatedReadTime:Math.ceil(a.split(/\s+/).length/200)}}}async function I(a){try{let b,c,e,{userId:f}=(0,x.j)();if(!f)return w.NextResponse.json({success:!1,error:"Unauthorized"},{status:401});let{type:g,ideaId:h,mode:i="generate",grant:j,parameters:k={},stream:l=!1,saveToDocuments:m=!0}=await a.json();if(!g)return w.NextResponse.json({success:!1,error:"Content type is required"},{status:400});let n=Object.values(A);if(!n.includes(g))return w.NextResponse.json({success:!1,error:`Invalid content type. Supported types: ${n.join(", ")}`},{status:400});if(g===A.GRANT_PROPOSAL&&j){if(!(b=G.getGrantTemplate(j)))return w.NextResponse.json({success:!1,error:`Invalid grant type: ${j}`},{status:400})}else b=G.getTemplate(g);if(!b)return w.NextResponse.json({success:!1,error:"Template not found for specified type"},{status:400});if(h){let{data:a,error:b}=await y.supabase.from("business_ideas").select("*").eq("id",h).eq("user_id",f).single();b?console.error("Error loading business idea:",b):(k.businessName=k.businessName||a.name,k.businessIdea=k.businessIdea||a.summary,k.industry=k.industry||a.industry,k.targetMarket=k.targetMarket||a.target_market)}if(b.getParameters){let a=G.validateParameters(g,k);if(!a.valid)return w.NextResponse.json({success:!1,error:"Invalid parameters",details:a.errors},{status:400})}try{c=g===A.BUSINESS_PLAN||g===A.GRANT_PROPOSAL||g===A.PITCH_DECK||b.buildPrompt?b.buildPrompt(k):b.prompt}catch(a){return console.error("Error building prompt:",a),w.NextResponse.json({success:!1,error:"Failed to build generation prompt"},{status:500})}let o=G.estimateTokens(g),p=Math.min(o,4e3);try{if(l)return J(c,f,p);e=await d.openaiService.generateContent({prompt:c,maxTokens:p,temperature:.7,userId:f,stream:!1})}catch(a){return console.error("Content generation error:",a),w.NextResponse.json({success:!1,error:a.message||"Failed to generate content"},{status:500})}if(!e.success)return w.NextResponse.json({success:!1,error:e.error||"Generation failed"},{status:500});let q=H.formatContent(e.content,g),r=H.extractMetrics(q),s={type:g,grant:j,ideaId:h,parameters:k,usage:e.usage,model:e.model,mode:i,timestamp:new Date().toISOString(),metrics:r},t=null;if(m)try{let a=function(a,b,c){let d=new Date().toLocaleDateString();switch(a){case A.BUSINESS_PLAN:let e=c.businessName||"Business";return`${e} Business Plan - ${d}`;case A.GRANT_PROPOSAL:let f=b?b.toUpperCase():"Grant",g=c.projectTitle||c.businessName||"Project";return`${f} Grant Proposal - ${g} - ${d}`;case A.PITCH_DECK:let h=c.businessName||"Company";return`${h} Pitch Deck - ${d}`;default:return`AI Generated ${a.replace("_"," ")} - ${d}`}}(g,j,k),b=await K({userId:f,title:a,content:q,type:g,grant:j,metadata:s});b.success&&(t=b.document.id)}catch(a){console.error("Error saving generated content:",a)}try{await L({userId:f,type:g,grant:j,ideaId:h,documentId:t,usage:e.usage,success:!0})}catch(a){console.error("Error logging generation activity:",a)}return w.NextResponse.json({success:!0,content:q,metadata:s,documentId:t,usage:e.usage,metrics:r})}catch(a){return console.error("Generation API error:",a),w.NextResponse.json({success:!1,error:"Internal server error"},{status:500})}}async function J(a,b,c){let e=new TextEncoder,f=new ReadableStream({async start(f){try{for await(let g of d.openaiService.generateStreamingContent({prompt:a,maxTokens:c,temperature:.7,userId:b,stream:!0})){let a=`data: ${JSON.stringify(g)}

`;f.enqueue(e.encode(a))}f.enqueue(e.encode("data: [DONE]\n\n")),f.close()}catch(b){console.error("Streaming error:",b);let a=`data: ${JSON.stringify({error:b.message})}

`;f.enqueue(e.encode(a)),f.close()}}});return new w.NextResponse(f,{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache",Connection:"keep-alive"}})}async function K({userId:a,title:b,content:c,type:d,grant:f,metadata:g}){try{var h;let i=`${b.replace(/[^a-zA-Z0-9]/g,"_")}.md`,j=new Blob([c],{type:"text/markdown"}),k=new File([j],i,{type:"text/markdown"}),l=await e.documentService.uploadDocument(a,k,{document_type:(h=d,({[A.BUSINESS_PLAN]:"business_plan",[A.GRANT_PROPOSAL]:"grant_proposal",[A.PITCH_DECK]:"pitch_deck",[A.MARKET_ANALYSIS]:"research_document",[A.FINANCIAL_PLAN]:"financial_document"})[h]||"other"),description:`AI-generated ${d.replace("_"," ")} ${f?`(${f})`:""}`,tags:["ai-generated",d,...f?[f]:[]],generation_metadata:g});if(!l.success)throw Error(l.error);let{data:m,error:n}=await y.supabase.from("documents").insert({...l.document,generation_metadata:g}).select().single();if(n)throw n;return{success:!0,document:m}}catch(a){return console.error("Error saving generated content:",a),{success:!1,error:a.message}}}async function L({userId:a,type:b,grant:c,ideaId:d,documentId:e,usage:f,success:g}){try{await y.supabase.from("generation_logs").insert({user_id:a,content_type:b,grant_type:c,business_idea_id:d,document_id:e,tokens_used:f?.totalTokens||0,success:g,created_at:new Date().toISOString()})}catch(a){console.error("Error logging generation activity:",a)}}async function M(a){try{let{userId:a}=(0,x.j)();if(!a)return w.NextResponse.json({success:!1,error:"Unauthorized"},{status:401});let b=G.getAllTemplates(),c=Object.values(A),d=Object.values(B);return w.NextResponse.json({success:!0,templates:b,contentTypes:c,grantTypes:d,capabilities:{streaming:!0,maxTokens:4e3,supportedFormats:["markdown","text"],rateLimit:"10 requests per minute"}})}catch(a){return console.error("Get templates error:",a),w.NextResponse.json({success:!1,error:"Internal server error"},{status:500})}}async function N(){return new w.NextResponse(null,{status:200,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization"}})}e.StorageProvider;let O=new g.AppRouteRouteModule({definition:{kind:h.RouteKind.APP_ROUTE,page:"/api/generate/route",pathname:"/api/generate",filename:"route",bundlePath:"app/api/generate/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"/Users/homegrownentllc/Desktop/biz-plan-navigator-d8f6a579/app/api/generate/route.js",nextConfigOutput:"",userland:f}),{workAsyncStorage:P,workUnitAsyncStorage:Q,serverHooks:R}=O;function S(){return(0,i.patchFetch)({workAsyncStorage:P,workUnitAsyncStorage:Q})}async function T(a,b,c){var d;let e="/api/generate/route";"/index"===e&&(e="/");let f=await O.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!f)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:g,params:i,nextConfig:w,isDraftMode:x,prerenderManifest:y,routerServerContext:z,isOnDemandRevalidate:A,revalidateOnlyGenerated:B,resolvedPathname:C}=f,D=(0,l.normalizeAppPath)(e),E=!!(y.dynamicRoutes[D]||y.routes[C]);if(E&&!x){let a=!!y.routes[C],b=y.dynamicRoutes[D];if(b&&!1===b.fallback&&!a)throw new u.NoFallbackError}let F=null;!E||O.isDev||x||(F="/index"===(F=C)?"/":F);let G=!0===O.isDev||!E,H=E&&!G,I=a.method||"GET",J=(0,k.getTracer)(),K=J.getActiveScopeSpan(),L={params:i,prerenderManifest:y,renderOpts:{experimental:{cacheComponents:!!w.experimental.cacheComponents,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:G,incrementalCache:(0,j.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:H,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>O.onRequestError(a,b,d,z)},sharedContext:{buildId:g}},M=new m.NodeNextRequest(a),N=new m.NodeNextResponse(b),P=n.NextRequestAdapter.fromNodeNextRequest(M,(0,n.signalFromNodeResponse)(b));try{let d=async c=>O.handle(P,L).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=J.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==o.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${I} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${I} ${a.url}`)}),f=async f=>{var g,i;let k=async({previousCacheEntry:g})=>{try{if(!(0,j.getRequestMeta)(a,"minimalMode")&&A&&B&&!g)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(f);a.fetchMetrics=L.renderOpts.fetchMetrics;let h=L.renderOpts.pendingWaitUntil;h&&c.waitUntil&&(c.waitUntil(h),h=void 0);let i=L.renderOpts.collectedTags;if(!E)return await (0,q.I)(M,N,e,L.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,r.toNodeOutgoingHttpHeaders)(e.headers);i&&(b[t.NEXT_CACHE_TAGS_HEADER]=i),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==L.renderOpts.collectedRevalidate&&!(L.renderOpts.collectedRevalidate>=t.INFINITE_CACHE)&&L.renderOpts.collectedRevalidate,d=void 0===L.renderOpts.collectedExpire||L.renderOpts.collectedExpire>=t.INFINITE_CACHE?void 0:L.renderOpts.collectedExpire;return{value:{kind:v.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==g?void 0:g.isStale)&&await O.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,p.c)({isRevalidate:H,isOnDemandRevalidate:A})},z),b}},l=await O.handleResponse({req:a,nextConfig:w,cacheKey:F,routeKind:h.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:y,isRoutePPREnabled:!1,isOnDemandRevalidate:A,revalidateOnlyGenerated:B,responseGenerator:k,waitUntil:c.waitUntil});if(!E)return null;if((null==l||null==(g=l.value)?void 0:g.kind)!==v.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(i=l.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,j.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",A?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),x&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,r.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,j.getRequestMeta)(a,"minimalMode")&&E||m.delete(t.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,s.getCacheControlHeader)(l.cacheControl)),await (0,q.I)(M,N,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};K?await f(K):await J.withPropagatedContext(a.headers,()=>J.trace(o.BaseServerSpan.handleRequest,{spanName:`${I} ${a.url}`,kind:k.SpanKind.SERVER,attributes:{"http.method":I,"http.target":a.url}},f))}catch(b){if(K||b instanceof u.NoFallbackError||await O.onRequestError(a,b,{routerKind:"App Router",routePath:D,routeType:"route",revalidateReason:(0,p.c)({isRevalidate:H,isOnDemandRevalidate:A})}),E)throw b;return await (0,q.I)(M,N,new Response(null,{status:500})),null}}},55511:a=>{"use strict";a.exports=require("crypto")},55591:a=>{"use strict";a.exports=require("https")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},74075:a=>{"use strict";a.exports=require("zlib")},77598:a=>{"use strict";a.exports=require("node:crypto")},78335:()=>{},79551:a=>{"use strict";a.exports=require("url")},81630:a=>{"use strict";a.exports=require("http")},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},96487:()=>{}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[4586,1692,2461,5164],()=>b(b.s=54097));module.exports=c})();