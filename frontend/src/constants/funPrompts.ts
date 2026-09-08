export interface FunPrompt {
  es: string;
  en: string;
  fr?: string;
  pt?: string;
}

export const FUN_PROMPTS: FunPrompt[] = [
  { es: "Quiero alguien que…", en: "I want someone who…", fr: "Je veux quelqu'un qui…", pt: "Eu quero alguém que…" },
  { es: "Una cosa curiosa sobre mí es…", en: "A curious thing about me is…", fr: "Une chose curieuse à propos de moi est…", pt: "Uma coisa curiosa sobre mim é…" },
  { es: "Mi playlist favorita es…", en: "My favorite playlist is…", fr: "Ma playlist préférée est…", pt: "Minha playlist favorita é…" },
  { es: "El mejor viaje que he hecho fue…", en: "The best trip I've taken was…", fr: "Le meilleur voyage que j'ai fait était…", pt: "A melhor viagem que fiz foi…" },
  { es: "Mi comida favorita es…", en: "My favorite food is…", fr: "Mon plat préféré est…", pt: "Minha comida favorita é…" },
  { es: "Algo que siempre me hace reír es…", en: "Something that always makes me laugh is…", fr: "Quelque chose qui me fait toujours rire est…", pt: "Algo que sempre me faz rir é…" },
  { es: "El último libro que leí fue…", en: "The last book I read was…", fr: "Le dernier livre que j'ai lu était…", pt: "O último livro que li foi…" },
  { es: "Mi serie favorita es…", en: "My favorite series is…", fr: "Ma série préférée est…", pt: "Minha série favorita é…" },
  { es: "El deporte que más disfruto es…", en: "The sport I enjoy most is…", fr: "Le sport que j'aime le plus est…", pt: "O esporte que mais gosto é…" },
  { es: "El lugar donde me siento más feliz es…", en: "The place where I feel happiest is…", fr: "L'endroit où je me sens le plus heureux est…", pt: "O lugar onde me sinto mais feliz é…" },
  { es: "Mi talento oculto es…", en: "My hidden talent is…", fr: "Mon talent caché est…", pt: "Meu talento oculto é…" },
  { es: "El mejor consejo que me han dado es…", en: "The best advice I've been given is…", fr: "Le meilleur conseil qu'on m'ait donné est…", pt: "O melhor conselho que recebi é…" },
  { es: "Mi bebida favorita es…", en: "My favorite drink is…", fr: "Ma boisson préférée est…", pt: "Minha bebida favorita é…" },
  { es: "El idioma que me gustaría aprender es…", en: "The language I'd like to learn is…", fr: "La langue que j'aimerais apprendre est…", pt: "O idioma que gostaria de aprender é…" },
  { es: "Mi recuerdo más divertido es…", en: "My funniest memory is…", fr: "Mon souvenir le plus drôle est…", pt: "Minha memória mais engraçada é…" },
  { es: "El mejor concierto al que fui es…", en: "The best concert I went to is…", fr: "Le meilleur concert auquel j'ai assisté est…", pt: "O melhor show que fui é…" },
  { es: "Mi película favorita es…", en: "My favorite movie is…", fr: "Mon film préféré est…", pt: "Meu filme favorito é…" },
  { es: "El hobby que nunca abandono es…", en: "The hobby I never give up is…", fr: "Le passe-temps que je n'abandonne jamais est…", pt: "O hobby que nunca abandono é…" },
  { es: "Algo que colecciono es…", en: "Something I collect is…", fr: "Quelque chose que je collectionne est…", pt: "Algo que coleciono é…" },
  { es: "Mi signo zodiacal es…", en: "My zodiac sign is…", fr: "Mon signe du zodiaque est…", pt: "Meu signo do zodíaco é…" },
  { es: "El emoji que más uso es…", en: "The emoji I use most is…", fr: "L'emoji que j'utilise le plus est…", pt: "O emoji que mais uso é…" },
  { es: "Mi comida de confort es…", en: "My comfort food is…", fr: "Mon aliment réconfortant est…", pt: "Minha comida de conforto é…" },
  { es: "El mejor regalo que recibí fue…", en: "The best gift I received was…", fr: "Le meilleur cadeau que j'ai reçu était…", pt: "O melhor presente que recebi foi…" },
  { es: "Mi estación del año favorita es…", en: "My favorite season is…", fr: "Ma saison préférée est…", pt: "Minha estação favorita é…" },
  { es: "El lugar que quiero visitar es…", en: "The place I want to visit is…", fr: "L'endroit que je veux visiter est…", pt: "O lugar que quero visitar é…" },
  { es: "Mi canción que nunca me canso de escuchar es…", en: "My song I never get tired of listening to is…", fr: "Ma chanson que je ne me lasse jamais d'écouter est…", pt: "Minha música que nunca canso de ouvir é…" },
  { es: "El mejor plan de fin de semana es…", en: "The best weekend plan is…", fr: "Le meilleur plan de week-end est…", pt: "O melhor plano de fim de semana é…" },
  { es: "Mi videojuego favorito es…", en: "My favorite video game is…", fr: "Mon jeu vidéo préféré est…", pt: "Meu videogame favorito é…" },
  { es: "El animal con el que más me identifico es…", en: "The animal I identify with most is…", fr: "L'animal auquel je m'identifie le plus est…", pt: "O animal com que mais me identifico é…" },
  { es: "Mi desayuno ideal es…", en: "My ideal breakfast is…", fr: "Mon petit-déjeuner idéal est…", pt: "Meu café da manhã ideal é…" },
  { es: "El idioma que hablo mejor es…", en: "The language I speak best is…", fr: "La langue que je parle le mieux est…", pt: "O idioma que falo melhor é…" },
  { es: "Mi aplicación favorita es…", en: "My favorite app is…", fr: "Mon application préférée est…", pt: "Meu aplicativo favorito é…" },
  { es: "El mejor recuerdo de la infancia es…", en: "The best childhood memory is…", fr: "Le meilleur souvenir d'enfance est…", pt: "A melhor memória da infância é…" },
  { es: "Mi postre favorito es…", en: "My favorite dessert is…", fr: "Mon dessert préféré est…", pt: "Minha sobremesa favorita é…" },
  { es: "El deporte que me gustaría probar es…", en: "The sport I'd like to try is…", fr: "Le sport que j'aimerais essayer est…", pt: "O esporte que gostaria de experimentar é…" },
  { es: "Mi película que siempre recomiendo es…", en: "My movie I always recommend is…", fr: "Mon film que je recommande toujours est…", pt: "Meu filme que sempre recomendo é…" },
  { es: "El lugar donde me gustaría vivir es…", en: "The place I'd like to live is…", fr: "L'endroit où j'aimerais vivre est…", pt: "O lugar onde gostaria de morar é…" },
  { es: "Mi comida que sé cocinar mejor es…", en: "My food I cook best is…", fr: "Mon plat que je cuisine le mieux est…", pt: "Minha comida que sei cozinhar melhor é…" },
  { es: "El mejor día de mi vida fue…", en: "The best day of my life was…", fr: "Le meilleur jour de ma vie était…", pt: "O melhor dia da minha vida foi…" },
  { es: "Mi canción que me anima siempre es…", en: "My song that always cheers me up is…", fr: "Ma chanson qui me remonte toujours le moral est…", pt: "Minha música que sempre me anima é…" },
  { es: "El hábito que nunca cambio es…", en: "The habit I never change is…", fr: "L'habitude que je ne change jamais est…", pt: "O hábito que nunca mudo é…" },
  { es: "Mi serie que puedo ver mil veces es…", en: "My series I can watch a thousand times is…", fr: "Ma série que je peux regarder mille fois est…", pt: "Minha série que posso assistir mil vezes é…" },
  { es: "El lugar donde me desconecto es…", en: "The place where I disconnect is…", fr: "L'endroit où je me déconnecte est…", pt: "O lugar onde me desconecto é…" },
  { es: "Mi bebida que nunca falta es…", en: "My drink that never runs out is…", fr: "Ma boisson qui ne manque jamais est…", pt: "Minha bebida que nunca falta é…" },
  { es: "El mejor consejo que daría es…", en: "The best advice I'd give is…", fr: "Le meilleur conseil que je donnerais est…", pt: "O melhor conselho que daria é…" },
  { es: "Mi recuerdo más romántico es…", en: "My most romantic memory is…", fr: "Mon souvenir le plus romantique est…", pt: "Minha memória mais romântica é…" },
  { es: "El hobby que quiero aprender es…", en: "The hobby I want to learn is…", fr: "Le passe-temps que je veux apprendre est…", pt: "O hobby que quero aprender é…" },
  { es: "Mi canción que me hace bailar es…", en: "My song that makes me dance is…", fr: "Ma chanson qui me fait danser est…", pt: "Minha música que me faz dançar é…" },
  { es: "El lugar que me inspira es…", en: "The place that inspires me is…", fr: "L'endroit qui m'inspire est…", pt: "O lugar que me inspira é…" },
  { es: "Mi comida que nunca rechazo es…", en: "My food I never refuse is…", fr: "Mon plat que je ne refuse jamais est…", pt: "Minha comida que nunca recuso é…" },
];

// Helper function to get prompts in the current language
export const getPromptsForLanguage = (locale: string): string[] => {
  const lang = locale.split('-')[0] as 'es' | 'en' | 'fr' | 'pt';
  return FUN_PROMPTS.map(prompt => prompt[lang] || prompt.en);
};
