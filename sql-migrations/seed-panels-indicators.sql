-- =====================================================
-- ESG Champions Platform - Seed Panels & Indicators
-- Run this after complete-database-schema.sql
-- =====================================================

-- Clear existing data (optional - comment out if you want to keep existing)
-- TRUNCATE panels, indicators CASCADE;

-- =====================================================
-- ENVIRONMENTAL PANELS
-- =====================================================

INSERT INTO panels (id, name, description, category, icon, color, order_index) VALUES
('e1000000-0000-0000-0000-000000000001', 'Climate Action', 'Measures and strategies for addressing climate change and reducing carbon footprint', 'environmental', 'thermometer', '#22c55e', 1),
('e2000000-0000-0000-0000-000000000002', 'Energy Management', 'Energy efficiency, renewable energy adoption, and consumption tracking', 'environmental', 'zap', '#10b981', 2),
('e3000000-0000-0000-0000-000000000003', 'Water Stewardship', 'Water usage, conservation, and wastewater management practices', 'environmental', 'droplet', '#06b6d4', 3),
('e4000000-0000-0000-0000-000000000004', 'Waste & Circular Economy', 'Waste reduction, recycling, and circular economy initiatives', 'environmental', 'recycle', '#84cc16', 4),
('e5000000-0000-0000-0000-000000000005', 'Biodiversity & Land Use', 'Protection of ecosystems, biodiversity, and sustainable land management', 'environmental', 'trees', '#059669', 5)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    order_index = EXCLUDED.order_index;

-- =====================================================
-- SOCIAL PANELS
-- =====================================================

INSERT INTO panels (id, name, description, category, icon, color, order_index) VALUES
('a1000000-0000-0000-0000-000000000001', 'Human Rights', 'Respect for human rights throughout operations and supply chain', 'social', 'shield', '#8b5cf6', 6),
('a2000000-0000-0000-0000-000000000002', 'Labor Practices', 'Fair employment, working conditions, and employee rights', 'social', 'users', '#a855f7', 7),
('a3000000-0000-0000-0000-000000000003', 'Health & Safety', 'Workplace health, safety programs, and employee wellbeing', 'social', 'heart', '#ec4899', 8),
('a4000000-0000-0000-0000-000000000004', 'Diversity & Inclusion', 'Promoting diversity, equity, and inclusive workplace culture', 'social', 'sparkles', '#f472b6', 9),
('a5000000-0000-0000-0000-000000000005', 'Community Engagement', 'Stakeholder engagement, social impact, and community investment', 'social', 'building', '#d946ef', 10)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    order_index = EXCLUDED.order_index;

-- =====================================================
-- GOVERNANCE PANELS
-- =====================================================

INSERT INTO panels (id, name, description, category, icon, color, order_index) VALUES
('b1000000-0000-0000-0000-000000000001', 'Corporate Governance', 'Board structure, executive compensation, and shareholder rights', 'governance', 'landmark', '#f59e0b', 11),
('b2000000-0000-0000-0000-000000000002', 'Ethics & Compliance', 'Business ethics, anti-corruption, and regulatory compliance', 'governance', 'scale', '#eab308', 12),
('b3000000-0000-0000-0000-000000000003', 'Risk Management', 'ESG risk identification, assessment, and mitigation strategies', 'governance', 'alert-triangle', '#f97316', 13),
('b4000000-0000-0000-0000-000000000004', 'Transparency & Reporting', 'ESG disclosure, reporting frameworks, and stakeholder communication', 'governance', 'file-text', '#fb923c', 14)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    order_index = EXCLUDED.order_index;

-- =====================================================
-- CLIMATE ACTION INDICATORS
-- =====================================================

INSERT INTO indicators (panel_id, name, description, methodology, data_source, unit, frequency, order_index) VALUES
('e1000000-0000-0000-0000-000000000001', 'Scope 1 GHG Emissions', 'Direct greenhouse gas emissions from owned or controlled sources', 'GHG Protocol Corporate Standard methodology for direct emissions measurement', 'Internal emissions monitoring, fuel consumption records', 'tCO2e', 'Annual', 1),
('e1000000-0000-0000-0000-000000000001', 'Scope 2 GHG Emissions', 'Indirect emissions from purchased electricity, steam, heating, and cooling', 'GHG Protocol location-based and market-based methods', 'Utility bills, energy certificates', 'tCO2e', 'Annual', 2),
('e1000000-0000-0000-0000-000000000001', 'Scope 3 GHG Emissions', 'All other indirect emissions in the value chain', 'GHG Protocol Scope 3 Standard, covering 15 categories', 'Supplier data, life cycle assessments', 'tCO2e', 'Annual', 3),
('e1000000-0000-0000-0000-000000000001', 'Carbon Reduction Targets', 'Science-based targets for emission reductions aligned with Paris Agreement', 'SBTi methodology for 1.5°C or well-below 2°C pathways', 'Corporate commitments, SBTi validation', 'Percentage', 'Annual', 4),
('e1000000-0000-0000-0000-000000000001', 'Carbon Offset Investments', 'Investment in carbon offset projects and carbon credits', 'Verified Carbon Standard (VCS) or Gold Standard credits', 'Offset purchase records, project documentation', 'tCO2e offset', 'Annual', 5);

-- =====================================================
-- ENERGY MANAGEMENT INDICATORS
-- =====================================================

INSERT INTO indicators (panel_id, name, description, methodology, data_source, unit, frequency, order_index) VALUES
('e2000000-0000-0000-0000-000000000002', 'Total Energy Consumption', 'Total energy consumed across all operations', 'Sum of all energy sources (electricity, natural gas, fuel)', 'Utility meters, fuel purchase records', 'MWh', 'Monthly', 1),
('e2000000-0000-0000-0000-000000000002', 'Renewable Energy Share', 'Percentage of energy from renewable sources', 'Renewable energy certificates (RECs) and on-site generation', 'Energy contracts, REC documentation', 'Percentage', 'Annual', 2),
('e2000000-0000-0000-0000-000000000002', 'Energy Intensity', 'Energy consumption per unit of output or revenue', 'Total energy / production units or revenue', 'Energy data, production records', 'MWh/unit', 'Annual', 3),
('e2000000-0000-0000-0000-000000000002', 'Energy Efficiency Improvements', 'Year-over-year reduction in energy intensity', 'Comparison of energy intensity metrics', 'Historical energy and production data', 'Percentage', 'Annual', 4);

-- =====================================================
-- WATER STEWARDSHIP INDICATORS
-- =====================================================

INSERT INTO indicators (panel_id, name, description, methodology, data_source, unit, frequency, order_index) VALUES
('e3000000-0000-0000-0000-000000000003', 'Total Water Withdrawal', 'Total volume of water withdrawn from all sources', 'Metered water consumption from municipal, ground, surface sources', 'Water meters, utility bills', 'Cubic meters', 'Monthly', 1),
('e3000000-0000-0000-0000-000000000003', 'Water Recycling Rate', 'Percentage of water recycled and reused', 'Recycled water volume / total water consumption', 'Water treatment and recycling records', 'Percentage', 'Annual', 2),
('e3000000-0000-0000-0000-000000000003', 'Water Stress Assessment', 'Operations in water-stressed areas and mitigation measures', 'WRI Aqueduct Water Risk Atlas mapping', 'Facility locations, risk assessments', 'Risk score', 'Annual', 3),
('e3000000-0000-0000-0000-000000000003', 'Wastewater Treatment', 'Percentage of wastewater properly treated before discharge', 'Treatment compliance with local regulations', 'Discharge permits, treatment records', 'Percentage', 'Annual', 4);

-- =====================================================
-- WASTE & CIRCULAR ECONOMY INDICATORS
-- =====================================================

INSERT INTO indicators (panel_id, name, description, methodology, data_source, unit, frequency, order_index) VALUES
('e4000000-0000-0000-0000-000000000004', 'Total Waste Generated', 'Total waste produced from operations', 'Weight of all waste streams (hazardous and non-hazardous)', 'Waste manifests, disposal records', 'Metric tons', 'Annual', 1),
('e4000000-0000-0000-0000-000000000004', 'Waste Diversion Rate', 'Percentage of waste diverted from landfill', 'Recycled + composted + recovered / total waste', 'Recycling and waste disposal records', 'Percentage', 'Annual', 2),
('e4000000-0000-0000-0000-000000000004', 'Hazardous Waste Management', 'Proper handling and disposal of hazardous materials', 'Compliance with hazardous waste regulations', 'Hazardous waste manifests', 'Metric tons', 'Annual', 3),
('e4000000-0000-0000-0000-000000000004', 'Circular Economy Initiatives', 'Programs for product take-back, recycling, and material recovery', 'Assessment of circular economy implementation', 'Program documentation, material flow analysis', 'Score', 'Annual', 4);

-- =====================================================
-- BIODIVERSITY & LAND USE INDICATORS
-- =====================================================

INSERT INTO indicators (panel_id, name, description, methodology, data_source, unit, frequency, order_index) VALUES
('e5000000-0000-0000-0000-000000000005', 'Land Use Impact', 'Impact of operations on land and ecosystems', 'Land use change assessment, habitat impact evaluation', 'Site assessments, land surveys', 'Hectares', 'Annual', 1),
('e5000000-0000-0000-0000-000000000005', 'Biodiversity Protection Programs', 'Initiatives to protect and restore biodiversity', 'Number and scope of conservation programs', 'Program documentation, partnerships', 'Count', 'Annual', 2),
('e5000000-0000-0000-0000-000000000005', 'Deforestation-Free Supply Chain', 'Commitment to zero deforestation in supply chain', 'Supply chain mapping and certification verification', 'Supplier audits, certifications', 'Percentage', 'Annual', 3);

-- =====================================================
-- HUMAN RIGHTS INDICATORS
-- =====================================================

INSERT INTO indicators (panel_id, name, description, methodology, data_source, unit, frequency, order_index) VALUES
('a1000000-0000-0000-0000-000000000001', 'Human Rights Due Diligence', 'Systematic assessment of human rights risks', 'UN Guiding Principles on Business and Human Rights framework', 'Risk assessments, stakeholder consultations', 'Score', 'Annual', 1),
('a1000000-0000-0000-0000-000000000001', 'Forced Labor Prevention', 'Measures to prevent forced labor in operations and supply chain', 'ILO indicators of forced labor assessment', 'Supplier audits, worker interviews', 'Compliance rate', 'Annual', 2),
('a1000000-0000-0000-0000-000000000001', 'Child Labor Prevention', 'Policies and controls to prevent child labor', 'Age verification systems and audit protocols', 'Employment records, supplier audits', 'Compliance rate', 'Annual', 3),
('a1000000-0000-0000-0000-000000000001', 'Indigenous Rights', 'Respect for indigenous peoples rights and FPIC', 'Free, Prior and Informed Consent (FPIC) protocols', 'Community engagement records', 'Score', 'Annual', 4);

-- =====================================================
-- LABOR PRACTICES INDICATORS
-- =====================================================

INSERT INTO indicators (panel_id, name, description, methodology, data_source, unit, frequency, order_index) VALUES
('a2000000-0000-0000-0000-000000000002', 'Living Wage Commitment', 'Payment of living wages to all employees', 'Living wage benchmarking against local standards', 'Payroll data, wage studies', 'Percentage', 'Annual', 1),
('a2000000-0000-0000-0000-000000000002', 'Freedom of Association', 'Right to organize and collective bargaining', 'ILO Convention 87 and 98 compliance', 'Union agreements, worker surveys', 'Compliance rate', 'Annual', 2),
('a2000000-0000-0000-0000-000000000002', 'Employee Turnover Rate', 'Rate of voluntary and involuntary turnover', 'Departures / average headcount', 'HR records', 'Percentage', 'Annual', 3),
('a2000000-0000-0000-0000-000000000002', 'Training & Development Hours', 'Investment in employee skill development', 'Total training hours / total employees', 'Training records', 'Hours/employee', 'Annual', 4);

-- =====================================================
-- HEALTH & SAFETY INDICATORS
-- =====================================================

INSERT INTO indicators (panel_id, name, description, methodology, data_source, unit, frequency, order_index) VALUES
('a3000000-0000-0000-0000-000000000003', 'Lost Time Injury Rate (LTIR)', 'Frequency of injuries resulting in time away from work', 'Lost time injuries × 200,000 / hours worked', 'Safety incident reports', 'Rate', 'Monthly', 1),
('a3000000-0000-0000-0000-000000000003', 'Total Recordable Incident Rate (TRIR)', 'All recordable work-related injuries', 'Recordable incidents × 200,000 / hours worked', 'OSHA logs, incident reports', 'Rate', 'Monthly', 2),
('a3000000-0000-0000-0000-000000000003', 'Safety Training Completion', 'Percentage of employees completing required safety training', 'Completed training / required training', 'Training management system', 'Percentage', 'Annual', 3),
('a3000000-0000-0000-0000-000000000003', 'Mental Health Programs', 'Availability and utilization of mental health support', 'EAP utilization and mental health program metrics', 'HR and benefits data', 'Score', 'Annual', 4);

-- =====================================================
-- DIVERSITY & INCLUSION INDICATORS
-- =====================================================

INSERT INTO indicators (panel_id, name, description, methodology, data_source, unit, frequency, order_index) VALUES
('a4000000-0000-0000-0000-000000000004', 'Gender Diversity in Leadership', 'Representation of women in senior management', 'Female executives / total executives', 'HR records', 'Percentage', 'Annual', 1),
('a4000000-0000-0000-0000-000000000004', 'Pay Equity', 'Gender and racial pay gap analysis', 'Median pay comparison across demographics', 'Compensation data', 'Ratio', 'Annual', 2),
('a4000000-0000-0000-0000-000000000004', 'Workforce Diversity', 'Representation of underrepresented groups', 'Demographic breakdown of workforce', 'Self-reported demographics', 'Percentage', 'Annual', 3),
('a4000000-0000-0000-0000-000000000004', 'Inclusion Index', 'Employee perception of inclusive culture', 'Employee engagement survey scores', 'Survey results', 'Score', 'Annual', 4);

-- =====================================================
-- COMMUNITY ENGAGEMENT INDICATORS
-- =====================================================

INSERT INTO indicators (panel_id, name, description, methodology, data_source, unit, frequency, order_index) VALUES
('a5000000-0000-0000-0000-000000000005', 'Community Investment', 'Financial contributions to community programs', 'Total charitable giving and community investment', 'Finance records, grant documentation', 'Currency', 'Annual', 1),
('a5000000-0000-0000-0000-000000000005', 'Employee Volunteering', 'Hours contributed to community service', 'Total volunteer hours tracked', 'Volunteer program records', 'Hours', 'Annual', 2),
('a5000000-0000-0000-0000-000000000005', 'Local Supplier Spending', 'Procurement from local suppliers', 'Local procurement / total procurement', 'Procurement data', 'Percentage', 'Annual', 3),
('a5000000-0000-0000-0000-000000000005', 'Stakeholder Engagement', 'Quality and frequency of stakeholder dialogue', 'Assessment of engagement processes', 'Meeting records, feedback logs', 'Score', 'Annual', 4);

-- =====================================================
-- CORPORATE GOVERNANCE INDICATORS
-- =====================================================

INSERT INTO indicators (panel_id, name, description, methodology, data_source, unit, frequency, order_index) VALUES
('b1000000-0000-0000-0000-000000000001', 'Board Independence', 'Percentage of independent board members', 'Independent directors / total board members', 'Governance documents', 'Percentage', 'Annual', 1),
('b1000000-0000-0000-0000-000000000001', 'Board Diversity', 'Diversity of board composition', 'Assessment of gender, ethnic, and skill diversity', 'Board composition data', 'Score', 'Annual', 2),
('b1000000-0000-0000-0000-000000000001', 'Executive Compensation Ratio', 'CEO pay relative to median employee pay', 'CEO total compensation / median employee pay', 'Compensation disclosure', 'Ratio', 'Annual', 3),
('b1000000-0000-0000-0000-000000000001', 'ESG Oversight', 'Board-level responsibility for ESG matters', 'Assessment of ESG governance structure', 'Committee charters, minutes', 'Score', 'Annual', 4);

-- =====================================================
-- ETHICS & COMPLIANCE INDICATORS
-- =====================================================

INSERT INTO indicators (panel_id, name, description, methodology, data_source, unit, frequency, order_index) VALUES
('b2000000-0000-0000-0000-000000000002', 'Code of Conduct Training', 'Completion of ethics and compliance training', 'Employees completing training / total employees', 'Training records', 'Percentage', 'Annual', 1),
('b2000000-0000-0000-0000-000000000002', 'Anti-Corruption Measures', 'Implementation of anti-bribery and corruption controls', 'Assessment against FCPA/UK Bribery Act standards', 'Audit reports, control assessments', 'Score', 'Annual', 2),
('b2000000-0000-0000-0000-000000000002', 'Whistleblower Reports', 'Number and resolution of ethics hotline reports', 'Reports received and investigation outcomes', 'Ethics hotline data', 'Count', 'Annual', 3),
('b2000000-0000-0000-0000-000000000002', 'Regulatory Compliance', 'Compliance with applicable regulations', 'Number of violations and fines', 'Compliance records, legal filings', 'Count', 'Annual', 4);

-- =====================================================
-- RISK MANAGEMENT INDICATORS
-- =====================================================

INSERT INTO indicators (panel_id, name, description, methodology, data_source, unit, frequency, order_index) VALUES
('b3000000-0000-0000-0000-000000000003', 'ESG Risk Assessment', 'Systematic identification and assessment of ESG risks', 'Enterprise risk management framework integration', 'Risk registers, assessment reports', 'Score', 'Annual', 1),
('b3000000-0000-0000-0000-000000000003', 'Climate Risk (TCFD)', 'Climate-related risk disclosure per TCFD', 'TCFD framework implementation assessment', 'Climate risk disclosures', 'Score', 'Annual', 2),
('b3000000-0000-0000-0000-000000000003', 'Supply Chain Risk Management', 'Assessment and mitigation of supply chain ESG risks', 'Supplier ESG screening and monitoring', 'Supplier assessments, audits', 'Score', 'Annual', 3),
('b3000000-0000-0000-0000-000000000003', 'Business Continuity', 'Preparedness for ESG-related disruptions', 'BCP testing and scenario planning', 'BCP documentation, test results', 'Score', 'Annual', 4);

-- =====================================================
-- TRANSPARENCY & REPORTING INDICATORS
-- =====================================================

INSERT INTO indicators (panel_id, name, description, methodology, data_source, unit, frequency, order_index) VALUES
('b4000000-0000-0000-0000-000000000004', 'ESG Report Publication', 'Publication of comprehensive ESG/sustainability report', 'Assessment of report completeness and quality', 'Published reports', 'Boolean', 'Annual', 1),
('b4000000-0000-0000-0000-000000000004', 'Third-Party Assurance', 'External verification of ESG data', 'Scope and level of assurance obtained', 'Assurance statements', 'Score', 'Annual', 2),
('b4000000-0000-0000-0000-000000000004', 'Framework Alignment', 'Alignment with major reporting frameworks', 'Coverage of GRI, SASB, TCFD, etc.', 'Report indices, mapping', 'Count', 'Annual', 3),
('b4000000-0000-0000-0000-000000000004', 'Data Quality', 'Accuracy and completeness of ESG data', 'Data validation and quality control processes', 'Internal audits, data checks', 'Score', 'Annual', 4);

-- Update counts
SELECT 
    'Panels created: ' || COUNT(*) as message 
FROM panels;

SELECT 
    'Indicators created: ' || COUNT(*) as message 
FROM indicators;

