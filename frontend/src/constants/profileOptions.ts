export const GENDER_CATEGORIES = [
  {
    category: "Géneros tradicionales",
    options: [
      { label: "Masculino", description: "Identidad de hombre." },
      { label: "Femenino", description: "Identidad de mujer." },
      { label: "Común / No especificado", description: "Sin marcar género." },
      { label: "Andrógino", description: "Mezcla de rasgos masculinos y femeninos." },
      { label: "Epiceno", description: "Género neutral en lenguaje." }
    ]
  },
  {
    category: "No binarios y multigénero",
    options: [
      { label: "Agénero", description: "Sentir ausencia total de género." },
      { label: "Ambigénero", description: "Vivir el género de manera ambigua, sin definición clara." },
      { label: "Bigénero", description: "Identificarse con dos géneros, ya sea simultáneamente o alternando." },
      { label: "Omnigénero", description: "Sentirse identificado con todos los géneros posibles." },
      { label: "Genderqueer", description: "Término paraguas para identidades fuera de lo normativo." },
      { label: "Genderfluid / Flujo de género", description: "Género que cambia con el tiempo o las circunstancias." },
      { label: "Femfluid", description: "Fluidez hacia lo femenino." },
      { label: "Boyflux", description: "Intensidad variable de identidad masculina." },
      { label: "Girlflux", description: "Intensidad variable de identidad femenina." },
      { label: "Fluidflux", description: "Fluidez con variación de intensidad." },
      { label: "Semifluido", description: "Fluidez parcial." },
      { label: "Demiflux", description: "Fluidez limitada." }
    ]
  },
  {
    category: "Géneros basados en experiencia individual",
    options: [
      { label: "Autogénero", description: "Definido por uno mismo." },
      { label: "Apagender", description: "Sentir ausencia parcial de género." },
      { label: "Anogender", description: "Género inexistente o vacío." },
      { label: "Ceterogénero", description: "Relacionado con otro género distinto." },
      { label: "Amaregender", description: "Influido por el amor." },
      { label: "Cassgender", description: "Género indiferente." },
      { label: "Cassflux", description: "Indiferencia con variación." },
      { label: "Cavusgender", description: "Género con vacío interno." },
      { label: "Blurgender", description: "Difuso, poco claro." },
      { label: "Colorgénero", description: "Asociado a colores." },
      { label: "Cloudgender", description: "Como una nube, indefinido." },
      { label: "Genderflow", description: "Flujo constante de género." },
      { label: "Genderfuzz", description: "Borroso, confuso." },
      { label: "Genderblank", description: "Sensación de vacío." },
      { label: "Affectugender", description: "Influido por emociones." },
      { label: "Caelgender", description: "Relacionado con lo celestial." },
      { label: "Deliciagender", description: "Género placentero." },
      { label: "Domgender", description: "Género dominante." },
      { label: "Duragender", description: "Género duradero." },
      { label: "Esspigender", description: "Género espiritual." },
      { label: "Existencia de género", description: "Basado en existir como género." },
      { label: "Healgender", description: "Género sanador." },
      { label: "Mirrorgender", description: "Reflejado en otros." }
    ]
  },
  {
    category: "Dentro del espectro trans",
    options: [
      { label: "Cisgénero", description: "Identidad coincide con sexo asignado." },
      { label: "Transgénero", description: "Identidad distinta al sexo asignado." }
    ]
  },
  {
    category: "Géneros raros o microlabels",
    options: [
      { label: "Abimegénero", description: "Género profundo, abismal." },
      { label: "Aerogénero", description: "Ligero como el aire." },
      { label: "Alexigender", description: "Género difícil de definir." },
      { label: "Aliusgender", description: "Género distinto a lo común." },
      { label: "Ambonec", description: "Masculino y femenino, pero sin encajar." },
      { label: "Amicagender", description: "Género amistoso." },
      { label: "Anesigender", description: "Género anestesiado, apagado." },
      { label: "Angenital", description: "Sin relación con genitalidad." },
      { label: "Anongender", description: "Género anónimo." },
      { label: "Antegénero", description: "Género previo a definirse." },
      { label: "Anxiegender", description: "Influido por ansiedad." },
      { label: "Apconsugender", description: "Género condicionado por circunstancias." },
      { label: "Astergénero", description: "Relacionado con estrellas." },
      { label: "Autigéndromo", description: "Género ligado al autismo." },
      { label: "Axígénero", description: "Género con eje central." },
      { label: "Biogénero", description: "Relacionado con lo biológico." },
      { label: "Burstgender", description: "Género explosivo, cambiante." },
      { label: "Cendgender", description: "Género ceniza, apagado." },
      { label: "Ceterofluido", description: "Fluidez hacia otro género." },
      { label: "Condigénero", description: "Género condicionado." },
      { label: "Demigénero", description: "Parcialmente identificado con un género." },
      { label: "Egogénero", description: "Definido por el yo." },
      { label: "Gemigmander", description: "Género gemelo o dual." }
    ]
  }
];

export const PRONOUN_CATEGORIES = [
  {
    category: "Pronombres tradicionales",
    options: ["Él", "Ella"]
  },
  {
    category: "Pronombres no binarios",
    options: ["Elle", "Ellx", "Ell@"]
  },
  {
    category: "Pronombres neutros internacionales",
    options: ["They/Them", "Ze/Zir", "Xe/Xem", "Fae/Faer"]
  }
];

export const INTENTION_OPTIONS = [
  { 
    value: "serious_relationship", 
    label: "Relación", 
    emoji: "❤️", 
    description: "Buscas un vínculo estable y emocional con compromiso." 
  },
  { 
    value: "open_relationship", 
    label: "Relación, pero no me cierro", 
    emoji: "💕", 
    description: "Abierto/a a un vínculo serio, pero con flexibilidad para explorar." 
  },
  { 
    value: "casual_fun", 
    label: "Diversión, pero no me cierro", 
    emoji: "😎", 
    description: "Buscas experiencias ligeras, aunque no descartas una conexión si fluye." 
  },
  { 
    value: "short_term_fun", 
    label: "Relación abierta", 
    emoji: "🧑‍🤝‍🧑", 
    description: "Abierto/a a vínculos no monógamos o relaciones poliamorosas." 
  },
  { 
    value: "friendship", 
    label: "Hacer amigos", 
    emoji: "🧡", 
    description: "Buscas conectar con gente nueva sin expectativas románticas." 
  },
  { 
    value: "hobbies", 
    label: "Compartir gustos", 
    emoji: "🎶", 
    description: "Buscas afinidad en cultura, música o pasatiempos específicos." 
  },
  { 
    value: "travel", 
    label: "Viajar/Eventos", 
    emoji: "🌍", 
    description: "Buscas compañía para experiencias, viajes o eventos puntuales." 
  },
  { 
    value: "undecided", 
    label: "Lo sigo pensando", 
    emoji: "🤔", 
    description: "En modo exploratorio. No quieres definirte aún y prefieres fluir." 
  }
];

export const RELATIONSHIP_TYPE_OPTIONS = [
  {
    value: 'monogamy',
    label: 'Monógama',
    emoji: '💑',
    description: 'Buscas exclusividad emocional y sexual con una sola persona.',
    group: 'exclusive'
  },
  {
    value: 'polyamory',
    label: 'Poliamor',
    emoji: '🌈',
    description: 'Puedes amar a más de una persona, con acuerdos claros.',
    group: 'open'
  },
  {
    value: 'open',
    label: 'Relación abierta',
    emoji: '🔓',
    description: 'Tienes un vínculo principal, pero con apertura sexual consensuada.',
    group: 'open'
  },
  {
    value: 'swinger',
    label: 'Swinger',
    emoji: '🎭',
    description: 'Buscas experiencias compartidas en pareja, sin vínculo romántico.',
    group: 'open'
  }
];

export const FAMILY_PLAN_OPTIONS = [
  {
    value: 'wants_children',
    label: 'Quiero hijos',
    emoji: '👶',
    description: 'Tienes la intención de formar una familia en el futuro.'
  },
  {
    value: 'does_not_want_children',
    label: 'No quiero hijos',
    emoji: '🚫',
    description: 'Has decidido no tener hijos en tu proyecto de vida.'
  },
  {
    value: 'has_children_wants_more',
    label: 'Ya tengo hijos y quiero más',
    emoji: '👨‍👧',
    description: 'Eres padre/madre y estás abierto/a a tener más hijos.'
  },
  {
    value: 'has_children_no_more',
    label: 'Ya tengo hijos y no quiero más',
    emoji: '👩‍👦',
    description: 'Eres padre/madre y tu familia está completa.'
  },
  {
    value: 'undecided',
    label: 'Aún no lo sé',
    emoji: '🤷‍♂️',
    description: 'Todavía estás reflexionando sobre este tema.'
  }
];

export const CHILD_ACCEPTANCE_OPTIONS = [
  {
    value: 'accepts',
    label: 'Sí, no tengo problema',
    emoji: '✅',
    description: 'Estás abierto/a a conectar con personas que ya tengan hijos.'
  },
  {
    value: 'depends',
    label: 'Depende del contexto',
    emoji: '⚠️',
    description: 'Evaluarías caso por caso según la situación.'
  },
  {
    value: 'no_acceptance',
    label: 'No, prefiero que no tenga hijos',
    emoji: '❌',
    description: 'Prefieres conectar con personas sin hijos.'
  }
];

export const COMMUNICATION_STYLE_OPTIONS = [
  {
    value: 'texting',
    label: 'Mensajes',
    emoji: '📱',
    description: 'Prefieres la comunicación por mensajes de texto.',
    careImpact: 'CARE priorizará matches que también prefieran mensajes y creará rituales escritos íntimos.'
  },
  {
    value: 'phone_call',
    label: 'Llamadas',
    emoji: '📞',
    description: 'Te gusta hablar por teléfono y tener conversaciones profundas.',
    careImpact: 'CARE usará un tono más directo y emocional en las interacciones.'
  },
  {
    value: 'video_call',
    label: 'Videollamadas',
    emoji: '📹',
    description: 'Prefieres ver a la persona mientras hablas.',
    careImpact: 'CARE priorizará progresión visual y revelación facial en Blind Mode.'
  },
  {
    value: 'bad_texter',
    label: 'Mal texter',
    emoji: '😅',
    description: 'No eres muy bueno/a respondiendo mensajes.',
    careImpact: 'CARE usará un tono paciente y reducirá la frecuencia de notificaciones.'
  },
  {
    value: 'in_person',
    label: 'En persona',
    emoji: '🤝',
    description: 'Prefieres conocer a las personas cara a cara.',
    careImpact: 'CARE priorizará cercanía geográfica y sugerirá encuentros presenciales.'
  }
];

export const LOVE_LANGUAGE_OPTIONS = [
  {
    value: 'acts_of_service',
    label: 'Actos de servicio',
    emoji: '🛠️',
    description: 'Expresa amor a través de ayuda, cuidado y acciones concretas.',
    careImpact: 'CARE sugiere gestos y rituales de apoyo. Matching por estilo de cuidado.'
  },
  {
    value: 'gifts',
    label: 'Regalos',
    emoji: '🎁',
    description: 'Expresa amor mediante detalles y objetos significativos.',
    careImpact: 'CARE sugiere sorpresas y momentos simbólicos. Matching por estilo de expresión material.'
  },
  {
    value: 'physical_touch',
    label: 'Contacto físico',
    emoji: '🤗',
    description: 'Expresa amor a través del tacto, cercanía y presencia corporal.',
    careImpact: 'CARE sugiere progresión visual y física. Matching por cercanía geográfica y estilo afectivo.'
  },
  {
    value: 'words_of_affirmation',
    label: 'Palabras de afirmación',
    emoji: '💬',
    description: 'Expresa amor mediante elogios, reconocimiento y comunicación verbal.',
    careImpact: 'CARE adapta microcopy y frecuencia de mensajes. Matching por estilo verbal.'
  },
  {
    value: 'quality_time',
    label: 'Tiempo de calidad',
    emoji: '⏰',
    description: 'Expresa amor compartiendo momentos significativos y atención plena.',
    careImpact: 'CARE sugiere rituales compartidos. Matching por disponibilidad emocional and estilo de vida.'
  }
];

export const ATTRACTION_ORIENTATION_OPTIONS = [
  { value: "heterosexual", label: "Heterosexual", description: "Atracción por el género opuesto." },
  { value: "bisexual", label: "Bisexual", description: "Atracción por ambos géneros tradicionales." },
  { value: "pansexual", label: "Pansexual", description: "Atracción por personas independientemente de su género." },
  { value: "asexual", label: "Asexual", description: "Falta de atracción sexual hacia otros." },
  { value: "queer", label: "Queer", description: "Identidades y orientaciones fuera de lo normativo." },
  { value: "demisexual", label: "Demisexual", description: "Atracción sexual solo tras un vínculo emocional." },
  { value: "sapioerotico", label: "Sapioerótico/Sapiosexual", description: "Atracción por la inteligencia y el mundo interno." }
];

export const IDENTITY_COLORS = {
  traditional: '#2196F3', // Azul
  'non-binary': '#9C27B0', // Morado
  'trans-spectrum': '#4CAF50', // Verde
  microlabels: '#FFB300', // Dorado
  'experience-based': '#E91E63' // Rosa/Magenta
};

export const GENDER_TO_CATEGORY_MAP: Record<string, string> = {
  // Tradicionales
  "Masculino": "traditional",
  "Femenino": "traditional",
  "Común / No especificado": "traditional",
  "Andrógino": "traditional",
  "Epiceno": "traditional",
  // No binarios
  "Agénero": "non-binary",
  "Ambigénero": "non-binary",
  "Bigénero": "non-binary",
  "Omnigénero": "non-binary",
  "Genderqueer": "non-binary",
  "Genderfluid / Flujo de género": "non-binary",
  "Femfluid": "non-binary",
  "Boyflux": "non-binary",
  "Girlflux": "non-binary",
  "Fluidflux": "non-binary",
  "Semifluido": "non-binary",
  "Demiflux": "non-binary",
  "Autogénero": "non-binary",
  "Apagender": "non-binary",
  "Anogender": "non-binary",
  "Ceterogénero": "non-binary",
  "Amaregender": "non-binary",
  "Cassgender": "non-binary",
  "Cassflux": "non-binary",
  "Cavusgender": "non-binary",
  "Blurgender": "non-binary",
  "Colorgénero": "non-binary",
  "Cloudgender": "non-binary",
  "Genderflow": "non-binary",
  "Genderfuzz": "non-binary",
  "Genderblank": "non-binary",
  "Affectugender": "non-binary",
  "Caelgender": "non-binary",
  "Deliciagender": "non-binary",
  "Domgender": "non-binary",
  "Duragender": "non-binary",
  "Esspigender": "non-binary",
  "Existencia de género": "non-binary",
  "Healgender": "non-binary",
  "Mirrorgender": "non-binary",
  // Trans
  "Cisgénero": "trans-spectrum",
  "Transgénero": "trans-spectrum"
};
