/* Editorial content. Edit this file to update the site; no build step is required.
   Only public, checked information is used. Keep unpublished data out of this file. */
window.PORTFOLIO = {
  name: 'Yuanjing Zhao',
  preferredName: 'Yuanjing (Jason) Zhao',
  role: 'PhD researcher · Chemical engineering',
  affiliation: 'University of Surrey',
  email: 'yuanjing.zhao@surrey.ac.uk',
  links: {
    university: 'https://www.surrey.ac.uk/people/yuanjing-jason-zhao',
    scholar: 'https://scholar.google.com/citations?user=balopHwAAAAJ&hl=en',
    github: null, // Add your confirmed GitHub profile URL here.
    linkedin: null, // Add your preferred LinkedIn URL here.
    cv: null // Example: 'references/Yuanjing_Zhao_CV.pdf'. Hidden until provided.
  },
  projects: [
    {
      id: 'methanol', number: '01', category: 'ELECTRIFIED CHEMICALS',
      title: 'A different route to methanol.',
      short: 'Connecting CO₂ electrolysis, renewable hydrogen and process-level performance.',
      status: 'Published research',
      overview: 'My research connects electrochemical conversion with whole-process modelling to investigate alternative routes to methanol. It brings technical performance, production cost and life-cycle environmental impact into the same assessment.',
      methods: ['Process integration', 'Techno-economic analysis', 'Life-cycle assessment', 'Symbolic regression'],
      question: 'How do component-level choices change the performance of an entire methanol production system?',
      link: 'https://doi.org/10.1002/ache.70009', linkText: 'Read the published study',
      source: 'https://www.surrey.ac.uk/people/yuanjing-jason-zhao'
    },
    {
      id: 'modelling', number: '02', category: 'MODELLING & OPTIMISATION',
      title: 'Less computation. More insight.',
      short: 'Interpretable surrogate models for exploring complex process design decisions.',
      status: 'Ongoing research',
      overview: 'I investigate surrogate-assisted multi-objective optimisation: combining first-principles process models, data-driven approximations and decision-making tools. The aim is to explore trade-offs while retaining a connection to the underlying engineering.',
      methods: ['Surrogate modelling', 'Symbolic regression', 'Multi-objective optimisation', 'Sensitivity analysis'],
      question: 'How can fast, interpretable models support better engineering decisions?',
      link: '#playground', linkText: 'Try the illustrative decision explorer',
      source: 'https://www.surrey.ac.uk/people/yuanjing-jason-zhao'
    },
    {
      id: 'carbon', number: '03', category: 'CARBON & SYSTEMS THINKING',
      title: 'Look beyond the molecule.',
      short: 'Exploring the choices between carbon storage, fuels and circular chemicals.',
      status: 'Perspective project · work in progress',
      overview: 'This perspective project considers captured carbon across competing destinations: geological storage, fuels and chemicals. It examines how resource constraints, regional context and policy can change the questions asked of carbon utilisation.',
      methods: ['Carbon allocation', 'Resource constraints', 'Systems analysis', 'Policy context'],
      question: 'How should we compare carbon destinations that deliver different services?',
      link: 'https://www.surrey.ac.uk/people/yuanjing-jason-zhao', linkText: 'View my research profile',
      source: 'https://www.surrey.ac.uk/people/yuanjing-jason-zhao'
    }
  ],
  publications: [
    {
      id: 'zhao2026electrified', year: 2026, type: 'article', label: 'Research article',
      title: 'Electrified Carbon-Neutral Methanol Production Pathways: A Multiscale Techno-Economic-Environmental Assessment Based on the UK Energy System',
      authors: 'Zhao, Y.; Wang, S.; Leonzio, G.; Xuan, J.; Yin, H.; Xing, L.',
      journal: 'Advanced Chemical Engineering', doi: '10.1002/ache.70009',
      note: 'Electrified pathways · Multiscale modelling · UK energy system',
      bibtex: '@article{zhao2026electrified,\n  author = {Zhao, Yuanjing and Wang, Shiyu and Leonzio, Grazia and Xuan, Jin and Yin, Huajie and Xing, Lei},\n  title = {Electrified Carbon-Neutral Methanol Production Pathways: A Multiscale Techno-Economic-Environmental Assessment Based on the {UK} Energy System},\n  journal = {Advanced Chemical Engineering},\n  year = {2026},\n  doi = {10.1002/ache.70009}\n}'
    },
    {
      id: 'zhao2026review', year: 2026, type: 'review', label: 'Review',
      title: 'From Thermal to Electrochemical CO₂-to-Methanol Conversion: A Comprehensive Review of Process Technologies, Techno-Economics, and Life-Cycle Performance',
      authors: 'Zhao, Y.; Wang, S.; Leonzio, G.; Fu, Q.; Wang, Y.; Xuan, J.; Xing, L.',
      journal: 'Carbon Capture Science & Technology', doi: '10.1016/j.ccst.2026.100603',
      note: 'Process technologies · Techno-economics · Life-cycle performance',
      bibtex: '@article{zhao2026review,\n  author = {Zhao, Y. and Wang, S. and Leonzio, G. and Fu, Q. and Wang, Y. and Xuan, J. and Xing, L.},\n  title = {From Thermal to Electrochemical {CO2}-to-Methanol Conversion: A Comprehensive Review of Process Technologies, Techno-Economics, and Life-Cycle Performance},\n  journal = {Carbon Capture Science \\& Technology},\n  year = {2026},\n  doi = {10.1016/j.ccst.2026.100603}\n}'
    }
  ],
  routes: {
    two: {
      label: 'Two-step pathway',
      note: 'A conceptual pathway, not a process flow diagram or mass balance.',
      feed: 'Captured CO₂', auxiliary: 'Renewable H₂ · water electrolysis', product: 'CH₃OH',
      nodes: [
        { name: 'CO₂ supply', sub: 'Carbon source', text: 'Captured carbon dioxide enters the conceptual system. Source, purity and upstream capture burdens matter to a full assessment.' },
        { name: 'Conditioning', sub: 'Prepare the feed', text: 'The carbon feed is conditioned for downstream synthesis. A detailed model would resolve purification, compression and their utility requirements.' },
        { name: 'Hydrogenation', sub: 'CO₂ + renewable H₂', text: 'Carbon dioxide and hydrogen are converted into methanol and water. Renewable hydrogen is supplied by water electrolysis; detailed reaction and recycle behaviour are not represented here.' },
        { name: 'Separation', sub: 'Recover methanol', text: 'The synthesis products are separated to recover methanol. Purity, recovery and heat integration are important system-level design choices.' }
      ]
    },
    three: {
      label: 'Three-step pathway',
      note: 'A conceptual pathway, not a process flow diagram or mass balance.',
      feed: 'Captured CO₂', auxiliary: 'Renewable H₂ · water electrolysis', product: 'CH₃OH',
      nodes: [
        { name: 'CO₂ supply', sub: 'Carbon source', text: 'Captured carbon dioxide provides the carbon feed. Its origin and preparation remain part of the overall system boundary.' },
        { name: 'CO₂ electrolysis', sub: 'CO-rich feed', text: 'Electrochemical CO₂ reduction produces a CO-rich stream. The realised product mixture and system performance depend on electrolyser operation.' },
        { name: 'Methanol synthesis', sub: 'CO / CO₂ + H₂', text: 'The carbon-containing stream is combined with hydrogen for methanol synthesis. Feed composition, operating conditions and recycle design must be resolved in a full model.' },
        { name: 'Separation', sub: 'Recover methanol', text: 'Downstream separation recovers methanol. The pathway adds electrochemical conversion before synthesis, creating additional integration choices.' }
      ]
    },
    conventional: {
      label: 'Conventional benchmark',
      note: 'A conceptual natural-gas benchmark; individual plants use different configurations.',
      feed: 'Natural gas', auxiliary: 'Steam · reforming feed', product: 'CH₃OH',
      nodes: [
        { name: 'Natural gas', sub: 'Fossil feedstock', text: 'Natural gas supplies carbon and hydrogen to this conceptual conventional benchmark. It is not a captured-carbon pathway.' },
        { name: 'Reforming', sub: 'Generate syngas', text: 'Reforming generates synthesis gas. The detailed reformer configuration, heat supply and gas composition are outside this illustrative diagram.' },
        { name: 'Methanol synthesis', sub: 'Syngas conversion', text: 'Synthesis gas is converted into methanol. Reaction, recycle and heat integration determine the performance of the full process.' },
        { name: 'Separation', sub: 'Recover methanol', text: 'Methanol is recovered from the synthesis products. A fair comparison requires consistent functional units and system boundaries.' }
      ]
    }
  }
};
