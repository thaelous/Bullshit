import { Question } from '../types';

export const TRIVIA_QUESTIONS: Question[] = [
  {
    id: 1,
    category: 'Naturaleza Extraña',
    question: '¿Qué animal produce naturalmente heces con forma cúbica para evitar que rueden cuesta abajo?',
    options: {
      A: 'El Wombat australiano',
      B: 'El Pangolín de Java',
      C: 'El Camaleón pigmeo',
      D: 'El Topo nariz de estrella'
    },
    correctOption: 'A',
    explanation: 'El wombat (marsupial de Australia) es el único animal en el planeta que produce heces cúbicas. Sus intestinos poseen zonas de diferente elasticidad que moldean las heces en cubos de 2 cm, impidiendo que rueden de las rocas donde marcan su territorio.'
  },
  {
    id: 2,
    category: 'Historia Improbable',
    question: 'Durante la Primera Guerra Mundial en 1914, ¿qué país declaró formalmente la guerra a Andorra sin que Andorra enviara soldados?',
    options: {
      A: 'El Imperio Otomano',
      B: 'Alemania (Imperio Alemán)',
      C: 'El Imperio Austrohúngaro',
      D: 'El Reino de Bulgaria'
    },
    correctOption: 'B',
    explanation: 'Andorra declaró la guerra al Imperio Alemán en 1914 con un ejército de solo 10 hombres. Debido a un descuido en el Tratado de Versalles, ¡Andorra fue olvidada en el pacto de paz y permaneció técnicamente en guerra con Alemania hasta 1958 (44 años después)!'
  },
  {
    id: 3,
    category: 'Anatomía y Ciencia',
    question: 'Si estiraras y alinearas todos los vasos sanguíneos (capilares, venas y arterias) de un solo cuerpo humano adulto, ¿qué distancia cubrirían aproximadamente?',
    options: {
      A: 'Aproximadamente 950 metros (menos de 1 km)',
      B: 'Unos 100 kilómetros (distancia entre dos ciudades)',
      C: 'Aproximadamente 100,000 kilómetros (más de dos veces la vuelta a la Tierra)',
      D: 'Casi 384,000 kilómetros (la distancia de la Tierra a la Luna)'
    },
    correctOption: 'C',
    explanation: 'Un adulto tiene cerca de 100,000 kilómetros de vasos sanguíneos. Dado que la circunferencia de la Tierra en el ecuador es de unos 40,075 km, tu red circulatoria podría envolver el planeta más de dos veces y media.'
  },
  {
    id: 4,
    category: 'Alimentos y Biología',
    question: 'Desde un punto de vista botánico y reproductivo, ¿qué son en realidad los pequeños granitos amarillos en la superficie de una fresa?',
    options: {
      A: 'Semillas no fecundadas del fruto carnoso',
      B: 'Los frutos reales e individuales de la planta (aquenios)',
      C: 'Glándulas de azúcar fosilizadas',
      D: 'Poros de transpiración con polen residual'
    },
    correctOption: 'B',
    explanation: 'La parte roja carnosa de la fresa es un receptáculo floral engrosado, no una fruta. Cada uno de los pequeños puntos amarillos en el exterior es un fruto independiente llamado "aquenio", y dentro de cada aquenio se encuentra la verdadera semilla.'
  },
  {
    id: 5,
    category: 'Geografía y Clima',
    question: '¿Cuál es el lugar geográfico que registra oficialmente la mayor cantidad de relámpagos por kilómetro cuadrado al año en todo el mundo?',
    options: {
      A: 'El valle del Río Congo en África Central',
      B: 'El Lago de Maracaibo en Venezuela (Relámpago del Catatumbo)',
      C: 'La meseta del Tíbet en el Himalaya',
      D: 'La península de Florida en Estados Unidos'
    },
    correctOption: 'B',
    explanation: 'El Relámpago del Catatumbo en el Lago de Maracaibo (Venezuela) genera hasta 250 relámpagos por kilómetro cuadrado al año. Ocurre hasta 300 noches por año, durante unas 10 horas cada noche, creando un espectáculo casi continuo.'
  },
  {
    id: 6,
    category: 'Cultura Pop y Marcas',
    question: 'Antes de fundar Nintendo como una compañía de videojuegos, ¿a qué negocio original se dedicó la empresa fundada en Kioto en 1889?',
    options: {
      A: 'Fabricación de naipes tradicionales japoneses de flores (Hanafuda)',
      B: 'Una cadena de hoteles del amor ("Love Hotels") por horas',
      C: 'Fabricación y venta de fideos instantáneos de arroz',
      D: 'Producción de juguetes mecánicos de madera para ferias'
    },
    correctOption: 'A',
    explanation: 'Fusajiro Yamauchi fundó Nintendo Koppai en 1889 para fabricar y vender "Hanafuda", cartas japonesas hechas a mano con cortezas de morera. Eran muy populares entre los jugadores de la Yakuza japonesa para apuestas clandestinas.'
  },
  {
    id: 7,
    category: 'Mundo Marino',
    question: '¿Cuántos corazones y de qué color es la sangre que tiene un pulpo común?',
    options: {
      A: '2 corazones y sangre de color verde esmeralda',
      B: '3 corazones y sangre de color azul intenso',
      C: '1 corazón central gigante y sangre violeta',
      D: '4 corazones tubulares y sangre transparente'
    },
    correctOption: 'B',
    explanation: 'Los pulpos tienen tres corazones (dos bombean sangre a las branquias y uno al resto del cuerpo). Su sangre es de color azul debido a que transporta oxígeno mediante hemocianina rica en cobre en lugar de hemoglobina con hierro.'
  },
  {
    id: 8,
    category: 'Inventos y Curiosidades',
    question: '¿Para qué se inventó originalmente el material que hoy conocemos como plástico de burbujas ("Bubble Wrap") en 1957?',
    options: {
      A: 'Como aislamiento térmico para trajes de buceo ártico',
      B: 'Como un papel tapiz o empapelado de pared moderno y texturizado',
      C: 'Para amortiguar las cajas de computadoras IBM durante envíos',
      D: 'Como flotadores de seguridad para asientos de aviones'
    },
    correctOption: 'B',
    explanation: 'Al Fielding y Marc Chavannes inventaron el plástico de burbujas intentando crear un papel tapiz tridimensional fácil de limpiar para hogares modernos. Cuando fracasó en la decoración, lo intentaron vender como aislamiento para invernaderos antes de patentarlo para embalaje.'
  },
  {
    id: 9,
    category: 'Zoología Insólita',
    question: '¿Qué método extremadamente inusual utilizan las tortugas de río australianas (como la tortuga del río Fitzroy) para respirar bajo el agua durante el invierno?',
    options: {
      A: 'Absorben oxígeno a través del tejido de su cloaca (respiración anal)',
      B: 'Almacenan burbujas en cavidades bajo su caparazón óseo',
      C: 'Metabolizan nitrógeno disuelto sin necesidad de oxígeno',
      D: 'Desarrollan branquias temporales en sus patas traseras'
    },
    correctOption: 'A',
    explanation: 'La tortuga del río Fitzroy (Rheodytes leukops) puede permanecer bajo el agua hasta por 3 semanas gracias a sacos bursales vascularizados en su cloaca, lo que le permite extraer hasta el 70% de su oxígeno a través de su parte trasera.'
  },
  {
    id: 10,
    category: 'Espacio y Astronomía',
    question: 'En el planeta Mercurio o Venus, los períodos de rotación y traslación son tan extraños que en Venus ocurre algo único en el sistema solar. ¿Qué fenómeno es?',
    options: {
      A: 'Un solo día en Venus (su rotación) dura más tiempo que un año entero venusiano (su órbita)',
      B: 'El Sol sale por el norte y se pone por el sur cada 12 horas terrestres',
      C: 'Posee dos lunas que chocan y se reconstruyen cada 500 años',
      D: 'La gravedad se invierte periódicamente durante el solsticio'
    },
    correctOption: 'A',
    explanation: 'Venus rota tan lentamente sobre su propio eje que un día sidéreo dura 243 días terrestres, mientras que completa su órbita alrededor del Sol en 225 días terrestres. ¡Un día en Venus es más largo que su propio año! Además gira en sentido retrógrado.'
  },
  {
    id: 11,
    category: 'Historia y Reyes',
    question: 'En 1872, la tripulación del bergantín Mary Celeste fue hallada misteriosamente desierta en el Atlántico. ¿Qué carga intacta transportaba el barco?',
    options: {
      A: '1,701 barriles de alcohol desnaturalizado industrial',
      B: '30 toneladas de lingotes de plata española',
      C: 'Un cargamento secreto de antigüedades egipcias para el Museo Británico',
      D: '500 cajas de rifles de repetición Winchester'
    },
    correctOption: 'A',
    explanation: 'El Mary Celeste transportaba 1,701 barriles de alcohol desnaturalizado. El barco navegaba a toda vela con comida y pertenencias intactas, pero sin un solo tripulante a bordo. Se cree que los vapores inflamables asustaron al capitán haciéndole ordenar evacuar temporalmente.'
  },
  {
    id: 12,
    category: 'Música y Sonido',
    question: '¿Qué famoso compositor clásico continuó componiendo después de quedarse sordo mordiendo una vara de madera apoyada en la tapa de su piano?',
    options: {
      A: 'Wolfgang Amadeus Mozart',
      B: 'Ludwig van Beethoven',
      C: 'Johann Sebastian Bach',
      D: 'Frédéric Chopin'
    },
    correctOption: 'B',
    explanation: 'Beethoven sujetaba una varilla de madera entre sus dientes mientras el otro extremo descansaba sobre la caja de resonancia del piano. Gracias a la conducción ósea a través de su mandíbula y cráneo, podía percibir las vibraciones del sonido a pesar de su sordera profunda.'
  },
  {
    id: 13,
    category: 'Reino Fungi y Naturaleza',
    question: '¿Cuál es considerado oficialmente el organismo vivo individual más grande del planeta Tierra por superficie?',
    options: {
      A: 'Un hongo Armillaria ostoyae en el Bosque Nacional Malheur en Oregón',
      B: 'La Gran Barrera de Coral en la costa de Queensland, Australia',
      C: 'El bosque clonal de álamos temblones "Pando" en Utah',
      D: 'La ballena azul antártica de 33 metros de largo'
    },
    correctOption: 'A',
    explanation: 'El "Hongo Humongous" (Armillaria ostoyae) en Oregón cubre casi 9.6 kilómetros cuadrados (unos 2,200 acres). Es una única red subterránea micelial genéticamente idéntica con una edad estimada entre 2,400 y 8,000 años.'
  },
  {
    id: 14,
    category: 'Literatura y Códices',
    question: '¿De qué material peculiar estaban hechas las primeras dentaduras postizas del primer presidente de EE.UU., George Washington?',
    options: {
      A: 'Madera de roble pulida y tratada con cera',
      B: 'Dientes humanos reales, marfil de hipopótamo y plomo con resortes de oro',
      C: 'Porcelana importada de la dinastía Qing con alambre de cobre',
      D: 'Huesos tallados de ballena boreal'
    },
    correctOption: 'B',
    explanation: 'El mito popular dice que las dentaduras de Washington eran de madera, pero en realidad estaban hechas de una combinación de dientes de personas esclavas, marfil tallado de colmillo de hipopótamo y morsa, y una base pesada de aleación de oro y plomo.'
  },
  {
    id: 15,
    category: 'Química y Elementos',
    question: '¿Cuál es el único metal de la tabla periódica que a temperatura ambiente normal (20°C a 25°C) permanece en estado completamente líquido?',
    options: {
      A: 'El Galio (Ga)',
      B: 'El Mercurio (Hg)',
      C: 'El Cesio (Cs)',
      D: 'El Francio (Fr)'
    },
    correctOption: 'B',
    explanation: 'El mercurio es el único metal líquido a temperatura ambiente estándar (punto de fusión de -38.8°C). Aunque el galio y el cesio se derriten con poco calor (el galio se derrite en la palma de la mano a 29.7°C), a 20°C permanecen sólidos.'
  },
  {
    id: 16,
    category: 'Cine y Efectos',
    question: '¿Qué sonido real grabó el diseñador de sonido Ben Burtt para crear el rugido icónico del monstruo Wookiee "Chewbacca" en Star Wars?',
    options: {
      A: 'Una mezcla de osos pardos, morsas, leones marinos y un tejón',
      B: 'Un león con dolor de garganta grabado en el zoológico de San Diego',
      C: 'El motor a reacción de un avión militar filtrado a baja velocidad',
      D: 'Un camello masticando paja alterado con sintetizadores analógicos'
    },
    correctOption: 'A',
    explanation: 'Ben Burtt combinó grabaciones de un oso pardo llamado Tarik que vivía en un zoológico de San José, complementado con morsas gimiendo sin agua, tejones agresivos y leones marinos para transmitir las emociones de Chewbacca.'
  }
];
