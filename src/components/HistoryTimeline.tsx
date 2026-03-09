import React, { useState } from 'react';
import { Music, Award, Globe, Users, Star, Scroll, Mic2, ChevronDown, ChevronUp } from 'lucide-react';

type HistoryEra = 'vintage' | 'retro' | 'classic' | 'modern';

import { API_URL } from '../config';

const BASE_URL = API_URL.replace('/api', '');

interface HistoryEvent {
    year: string;
    title: string;
    content: string;
    era: HistoryEra;
    icon?: React.ElementType;
    image?: string;
}

const historyData: HistoryEvent[] = [
    {
        year: "Introduction",
        title: "Une vieille dame éternellement jeune",
        content: "De la Lyre Cheminote et Municipale, on peut dire que c'est « une vielle dame de 139 ans qui a subi un lifting vers 50 ans et possède l'éternelle jeunesse ».",
        era: 'vintage',
        icon: Star
    },
    {
        year: "1886",
        title: "Le début !",
        content: "C'est le 2 août 1886 que le conseil municipal de l'époque, en les personnes de MM. Poisot, Ronal et Mettrier, mandatés par le Maire, Monsieur Charles OUDOT déposent, à la Préfecture de Haute-Marne, la demande officielle de création « d'une association ayant pour but l'étude et l'exécution de morceaux de musique, et, composée de jeunes gens intelligents ayant de bonnes dispositions pour apprendre » (sic.)\nL'accord préfectoral permet la naissance de la « Cécilienne », premier nom officiel de l'association. Elle est uniquement composée d’habitants du « Vieux Bourg ».",
        era: 'vintage',
        icon: Scroll,
        image: 'Histoire1.avif'
    },
    {
        year: "1897",
        title: "La Concorde",
        content: "En 1897 : les populations du « Vieux Bourg » et du « Quartier de la Gare » se sont rencontrée et partagent le même amour de la musique. Des Cheminots intègrent alors les rangs de la fanfare. Elle prend son caractère cheminot : la société change de nom et de sigle, elle est désormais dénommée « La Concorde de la Gare de Chalindrey et de Culmont » L’orchestre comporte une quinzaine d'exécutants.",
        era: 'vintage',
        icon: Users,
        image: 'Histoire2.avif'
    },
    {
        year: "1903",
        title: "Nouveau baptême",
        content: "En 1903, forte de 25 musiciens, l'Association connaît un nouveau baptême et devient « la Concorde ». Le nombre de ses membres justifie, auprès des Beaux-Arts, la première demande de subvention pour achats d'instruments.",
        era: 'vintage',
        icon: Scroll,
        image: 'Histoire3.avif'
    },
    {
        year: "1914 - 1929",
        title: "Les années difficiles",
        content: "Arrivent les années terribles de la première guerre mondiale: la « Concorde » doit suspendre ses activités entre 1914 et 1918. A la fin du conflit, la société a perdu plus de la moitié de ses membres ; elle peine à se redresser. Pourtant, la « Jeune Fanfare » retrouve, un temps, un certain dynamisme grâce à Gaston Maillefert, son Président et Maire de Chalindrey en 1919. C’est en 1922 qu’elle acquerra son premier drapeau. Puis s’étiole jusqu’à « entrer en sommeil » en 1929.\nCependant, la musique tient au cœur des « Sorciers Musiciens » : un groupe ; d’anciens, parmi lesquels Louis Galmiche, René Poupon, Fernand Hahn, Ernest Berné, Edouard Lombard, Fernand et Louis Parizot, Roger Aubry, Marcel Charnotet,…accompagnés de jeunes désireux de pratiquer l’art de la Musique et de faire revivre l'association, repartent de zéro.",
        era: 'vintage',
        icon: Mic2,
        image: 'Histoire4.avif'
    },

    {
        year: "1931 - 1944",
        title: "Renaissance et Guerre",
        content: "La « Lyre Ouvrière et Fanfare Municipale » reprend ses activités en 1931.\nEdmond Guillemot en est le « Chef de Musique », Messieurs Dalstein et Bernard sont « Sous-Chefs de Musique ».\nMonsieur Bernard succède à Monsieur Guillemot en 1935, puis Monsieur Biaux à partir du 10 octobre 1936.Monsieur Bernard ré-occupera les fonctions de Chef de Musique à partir de novembre 1957.\nLe comité poursuit son petit bonhomme de chemin jusqu'en 1939: l'enfer recommence, l'occupation et les bombardements aidant, les instruments sont détruits, des archives disparaissent.\nEt, même quand les hommes rentrent au foyer, il leur est impossible, aussi parce qu’interdit par l’occupant, de pratiquer leur passion.\nPourtant, après la seconde guerre mondiale, l’Association reprend très vite et très facilement ses activités : les répétitions recommencent. Son directeur, Camille Hinderer, de Culmont, donne les cours de solfège dès le 1er octobre 1944.\nL’Association retrouve aussi sa place dans la cité: l'orchestre est d'un grand secours pour tourner la page et panser les plaies. Un Conseil d'Administration est mis en place, et la vie de l'association continue sans encombre, en dépit des mutations fréquentes de musiciens, cheminots de métier pour la plupart.",
        era: 'retro',
        icon: Music
    },
    {
        year: "1953",
        title: "Lyre Cheminote et Fanfare Municipale",
        content: "Ses membres étant majoritairement employés SNCF, l’Association s’affilie à la toute jeune U.A. I. C. F. (Union Artistique et Intellectuelle des Cheminots Français), née en 1938, avec la création de la SNCF. Il est d'ailleurs significatif qu'à l'époque, tout Chef de Dépôt ou Chef de Gare, soit, d'office, nommé Président de l'association, (MM. Jeudi, Sadron, Orial, Jacobe, Han, Gérard, Parizot, Moreau…).\nLes nouveaux Statuts votés en 1953 en font désormais la « Lyre Cheminote et Fanfare Municipale »\nElle participe déjà à des manifestations internationales: le Concours International de l'U. S. I. C., (Union Sportive Internationale des Cheminots), en 1954, par exemple.\nA cette époque, il convient d'avoir étudié le solfège pendant trois ans avant de prétendre pratiquer un instrument !",
        era: 'retro',
        icon: Users
    },
    {
        year: "1955 - 1975",
        title: "Saisons d'évolution",
        content: "A la tête de l'orchestre: André Balay, professeur au Collège Henri Vincenot, de Chalindrey, violoniste et musicien dans l'âme, introduit paisiblement des méthodes plus adaptées aux temps présents. Peu à peu, les effectifs évoluent: de 24 en 1955, le nombre de musiciens passe à 69 en 1956; ils sont 89 en 1961.\nSe distinguant par la qualité de ses interprétations, la Lyre est affiliée à la C.M.F. (Confédération Musicale de France), par le biais de la Fédération Aube/Haute-Marne.\nA partir de cette époque, les élèves passent les examens de la CMF avec succès.\nLa Lyre prend ses quartiers au C. S. C. (Centre Socio Culturel), dès sa construction, en 1966. Entre classe de solfège au premier étage, et salle de répétition au sous-sol, il faut partager les pièces destinées aux cours d'instruments avec d'autres ateliers.\nForte de l'Ecole de Formation Musicale(ou solfège) qui l'accompagne, La Lyre Cheminote et Fanfare Municipale obtient, en date du 3 septembre 1971, l'Agrément Ministériel en Qualité d'Education Populaire.\nDe mutations en départ en retraites, les chefs d'orchestre se succèdent. Après le départ de André Balay, Gustave Obrecht prend la suite jusqu'en 1972. Vient alors Michel Coulon. Michel Malherbe le remplace en 1974.",
        era: 'retro',
        icon: Award
    },
    {
        year: "1978 - 1985",
        title: "Progression et Concours",
        content: "En 1978, Alain Antoine prend la baguette du chef. Pendant tout ce temps, les musiciens font d'énormes progrès et leur répertoire s'élargit; la Société musicale se bonifie au point de passer en tête de toutes les Sociétés du Sud Haut-Marnais.\nEn 1979, M. Beurier, soutenu par la municipalité de l'époque, dote l'orchestre d'un chef de musique. Il désigne Nathalie Voillemin-Lallemand pour diriger les 67 musiciens, filles et garçons en proportions égales, et assurer les cours de solfège à une quarantaine d'élèves, pour quatre niveaux de formation. Soit un total de plus de 110 membres au sein de l'Association. C'est à cette époque aussi qu'apparaît épisodiquement l'Orchestre Junior.\nUn des meilleurs moteurs de progrès étant de se mesurer aux autres, la Lyre participe régulièrement aux concours nationaux de la C.M.F., et intègre ainsi le classement national des Sociétés de Musique. Bourg-en-Bresse en 1983 et Vitry le François en 1985, sont les premières \"compétitions\" auxquelles l'Harmonie a participé, avec Mme Lallemand.",
        era: 'classic',
        icon: Award
    },
    {
        year: "1989 - 2004",
        title: "Fin du XXème siècle",
        content: "Depuis 1989, c'est Marie-Christine Rémongin qui dirige la destinée de l'Orchestre d'Harmonie de Chalindrey. Elle débute la musique sur les rangs de son Orchestre, et poursuit au C.N.R.R. (Conservatoire National de Musique de Région) de Besançon (Doubs-25), appelé aujourd’hui : CRR ou Conservatoire à Rayonnement Régional. Elle y obtient tous les diplômes indispensables à l'exercice de sa profession. Passionnée par la direction d'orchestre, elle décroche son DE. (Diplôme d'Etat) en 2002.\nCompétente, dotée du dynamisme et de l'enthousiasme de ses 19 printemps, avec l'aide du Conseil d'administration, et grâce au travail de volontaires, Marie-Christine va mettre toute son énergie à développer l'école de musique et à amener l'orchestre aux niveaux les plus hauts.\nAux professeurs de flûte traversière, de tuba (saxhorn), et trompette qui assuraient aussi, comme ils le pouvaient, les cours des autres instruments, viennent s'ajouter : les professeurs de saxophone, trombone à coulisse, de clarinette et percussions.\nMarie-Christine crée une classe d'orchestre en septembre 1991: motivation au travail pour les plus jeunes, il est un tremplin «sine qua non » permettant d'accéder aux rangs de l'Orchestre d'Harmonie, ou «Grand Orchestre ».\nLes « apprentis » ayant bien évolués et voyant leur nombre s’accroître par l’arrivée de nouveaux élèves débutants, un second orchestre d’élèves verra le jour en 1995, permettant de les répartir par niveaux plus homogènes.\nPour l’émulation des néophytes, ils s’appelleront « Orchestre A et Orchestre B »\nEn 1992, la Lyre Cheminote et Fanfare Municipale innove avec la première classe de cor d'harmonie, du département. Les classes de hautbois, en 1995 et de guitare en 1999, portent le nombre de professeurs à 11 en 2004, pour 3 seulement en 1989. Tous les professeurs sont des professionnels, diplômés et médaillés de C.N.R. (Conservatoires National de Région, dénommés aujourd’hui CRR) pour l'instrument qu'ils enseignent.",
        era: 'classic',
        icon: Star
    },
    {
        year: "Innovation",
        title: "Stages et Concours",
        content: "Innovation encore, avec le stage d'été, initié en 1992, dont la caractéristique est d'accepter aussi les musiciens débutants: de nombreuses vocations musicales ont vu le jour au cours de ces stages.\nToujours désireuse de progresser, la Lyre participe aux concours nationaux de la C.M.F., challenges qui obligent à se dépasser ! Oyonnax (1991), Besançon (1994), Sanvignes-les-Mines (1999), de nouveau Oyonnax (2003) et Dijon-Saint Apollinaire en 2015, sont les concours passés sous la houlette de Marie-Christine Rémongin.\nEnviron 60 musiciens dans l'orchestre d'harmonie, de moyenne d'âge de 20 ans, 140 élèves pour l'école de musique et dix-huit membres au Conseil d’Administration : c'était déjà plus de 200 membres qui constituaient La Lyre Cheminote et Municipale de l'an 2008, appellation qu'elle reçoit en novembre 1999",
        era: 'classic',
        icon: Award
    },
    {
        year: "Focus",
        title: "Une Association populaire !",
        content: "Si la Lyre Cheminote et Municipale offre une formation musicale et instrumentale d’exception, c'est grâce à toute une équipe de gens qui œuvrent pour la réussite de l'organisation.\nA cette fin, ils ont trouvé une complémentarité: l'action désintéressée assure les finances pour rémunérer des professionnels; ces derniers, en retour, s’adaptent aux circonstances et à leurs élèves et offrent un enseignement « au top », permettant un perfectionnement constant de l’Orchestre.\nDe cette collaboration active et fructueuse sont nés deux CD: « Hallucinations » en 1994 et « Projection » en 1999.\nC’est ainsi, à l'heure où fleurissent un peu partout des initiatives intellectuelles de grande envergure, qu’il est, à Chalindrey, une de ces associations d'amateurs sur lesquelles reposent la vie culturelle et l'animation des communes rurales.\nPar sa capacité d'enseignement et ses interventions toujours brillantes, La Lyre de Chalindrey démontre, avec talent que le « populaire », loin d'être médiocre, peut être de qualité et, en tous cas, signifie « qui plaît à tous »\nLa collaboration de la « municipalité du passage au second millénaire » a grandement contribué à permettre la réalisation du nouvel établissement, où l’Association trouve d’autant plus de chances de s’épanouir.\nSans oublier l’action des nombreux anonymes, membres du C.A., ou simples parents d'élèves, continuellement « au feu et sur le pont » lors des manifestations : Fête de la Musique, Réveillon du Nouvel An, Stages, journées pédagogiques, etc..., dont l'assiduité au travail permet d'entretenir et de soutenir une structure exemplaire.\nA travers ses classes d'orchestre, son harmonie et les formations réduites, constituées pour des occasions ponctuelles, La Lyre assure plus ou moins une moyenne d'une prestation par mois, mais on peut en tout cas en compter soixante-dix par an !\nUn autre facteur de perfectionnement est la rencontre amicale avec d'autres orchestres: régulièrement, le Grand Orchestre se produit en concert avec une formation invitée. Chacun assure sa partie, puis les ensembles n'en font plus qu'un, le temps d'un ou deux morceaux. Cela donne lieu à des échanges et des invitations en retour.",
        era: 'classic',
        icon: Users
    },
    {
        year: "Activités",
        title: "De ses activités !",
        content: "La Lyre concourt à l'animation de la Commune de Chalindrey. Que ce soit par les participations aux cérémonies patriotiques, par les différentes manifestations non-musicales: (Fête de la Musique, Nouvel An, animations autour du 14 juillet…) puis, bien sûr, par ses spectacles.\nEn alternance avec les concerts traditionnels de musique pure, l’Association dans son ensemble (musiciens, famille de musiciens, amis de famille ou d’autres associations…) s’est réunie pour des spectacles complets : « Cinéma » (1999) « Lost Love »,( 2001), « Vidéodélyre »,( 2003), « Notes de Chine », (2005, racontant le périple chinois de l’Orchestre d’Harmonie), «Magie, Sorciers et Fantastique » (2008) , « La Lyre fait son cirque » (2010), « Le Portail du temps »(2014).\nLes 75 années officielles de vie de l'Association ont permis, en avril 2006, de réunir quelques 400 anciens. L'espace de ce week-end de retrouvailles et de partage, \"l'Orchestre des 75 ans\" s'est formé: 200 musiciens, anciens, nouveaux, actuels, de \"7 à....ans\", selon l'expression consacrée, ont interprété d'un même élan: \"L'enfant au tambour\" et \" Playing Together, it's much better\". Ce fut aussi un temps fort ou les plus anciens furent célébrés, tel Auguste Beurier...\nDes retrouvailles qui ont aussi donné à d’anciens de La Lyre, envie de retrouver « les bancs de l’orchestre », ils ont repris goût à leur instrument, et aux retrouvailles avec les copains musiciens qui comme eux avaient laissé tomber...\nDès septembre 2006, L’orchestre Zen a vu le jour. Zen, un orchestre qui portait bien son nom.....\nL'envie de rejoindre ses enfants, de faire comme eux, de réaliser « un rêve de gosse », a poussé de purs néophytes à rejoindre « le Zen », retrouvant ainsi la possibilité de partager, entre amis, le plaisir de faire de la musique, sans contraintes.\nException faite du Concert Annuel de 2007, où le Zen a été invité à être en première partie de l'Orchestre d'Harmonie, comme tous les Ensembles des Elèves, l'Orchestre des plus de vingt ans se produisait une seule fois par an, à l'occasion de la Fête de la Musique.\nLa plupart des musiciens du Zen ayant intégré d’autres orchestres de La Lyre, et faute de nouveaux « aspirants », le Zen a jeté ses derniers feux pour la Fête de La Musique 2015.\nCes 75 ans ont provoqué une autre « naissance » : celle de « l’Atelier Improvisation », avec « Babass », Sébastien Huguenin, comme professeur.\nEt il est étonnant de constater ce que produisent les élèves improvisateurs, dès la fin du premier trimestre de travail! Grâce à l’Impro, des musiciens, trop peu sûrs d’eux, découvrent ce qu’ils sont capables de faire, de jouer et de créer...",
        era: 'classic',
        icon: Music
    },
    {
        year: "Rayonnement",
        title: "Voyages et Rencontres",
        content: "Un atout dans la manche de l'association : elle ne craint pas de se produire en extérieur. D'abord, dans le cadre de manifestations patriotiques et de commémorations : 500ème anniversaire de la découverte de l'Amérique, Libération de Langres, d’Andelot, année Mozart..., et à l'occasion de festivals nationaux ou internationaux: Paris (75), Lille (59), Metz (54), Tour (37), Vesoul(70), Epernay(51), Chalons en Champagne(51), Lyon (69).\nEntre les \" Dimanches musicaux de Châlon en Champagne\", les « Dimanches du Canal Saint Martin (Paris), les 100 ans de l'Harmonie SNCF de Côte d'Or, la \"Fête des Jonquilles\", celle \"de la Choucroute\", des échanges avec Charleville-Maizière(08), Saint Marcel-les-Valence(69), Bons en Chablais(01), Port-sur-Saône(70), Saint Apollinaire(21)...La Lyre poursuit son bonhomme de chemin.\nMais ce n’est pas tout : elle s’exporte loin de nos frontières avec succès. En septembre 2004, l’Orchestre d’Harmonie a participé aux Festivals Internationaux de Musique et de Folklore, à Shanghai et à Pékin, représentant la France avec un tel brio qu’il s’est retrouvé à la place d’honneur, la première, lors d’un classement final !\nEt c’est sur l’Ile de La Réunion que les Sorciers ont été à la rencontre des écoliers locaux en février 2018",
        era: 'modern',
        icon: Globe
    },
    {
        year: "La Vie",
        title: "La vie en Musique, la Musique de La Vie",
        content: "L'Association conserve sa spécificité à travers le temps et les épreuves: sa force reste le bénévolat.\nComme ses prédécesseurs des premiers temps, Messieurs Poisot, Henriot, Biaux, Bazin,… qui se chargeaient volontiers du transport des instruments volumineux, (grosse caisse, par exemple), ou encore de l’équipement de l’aménagement et de la décoration des salles de répétition, Serge Malbrun, Président de 1980 à 1987, a « mis la main au plâtre» pour agrandir et insonoriser la salle d'orchestre, dans les sous-sols du C.S.C.\nDe 1987 à septembre 1994, Claude Placet, son successeur, est celui qui a soutenu la toute nouvelle et toute jeune directrice, Marie-Christine Rémongin et a encouragé tous ses projets, à commencer par le développement de l’Ecole de Musique. Il a également laissé le souvenir ébloui des décors réalisés à l'occasion des Concerts Annuel « La Marinouche », « Train de Plaisir », étant ainsi précurseur des futurs concerts-spectacles.\nGérard Pianetti a permis et a participé à la réalisation de l'estrade de la salle d'orchestre, et reste un des artisans de la nouvelle Ecole de Musique, rue jean Jaurès. Fonceur, il a pris le risque et a largement contribué, grâce à un anglais parfait et à ses contacts dans le monde du transport, à l’achat de quatre timbales aux U.S.A.\nC’est sous la présidence de Delphine Robinet, qui pendant six mois a travaillé d’arrachepied au projet, que, en septembre 2004, les musiciens sorciers ont pu découvrir « L’Empire du Milieu » !\nEn 2003, La Lyre avait offert au public le premier « Concert de Noël » : un temps privilégié « en attendant Noël ». Initialement composé de musique sur le thème exclusif de « La » Fête de Noël, il s’est peu à peu étoffé avec la participation des élèves de l’Ecole de Musique de La Lyre, pour deux chants, et d’un conte, fil rouge et transition entre toutes les œuvres au programme.\nCe moment hors du temps pour attendre Noël recueille un énorme succès : de 600 à 700 spectateurs tous les décembres, sur Chalindrey\nEn Novembre 2004, Antoine Bertrand préside à la destinée de la Lyre. Ce fin stratège a offert d'autres ouvertures à l'association. Humaniste, en septembre 2006 il a encouragé le début d'une nouvelle aventure suscitée par la Lyre: \"l'Orchestre à l'Ecole\", une autre manière d'appréhender la musique pour un public qui, sans cela, y serait totalement étranger.\nEn partenariat avec le Conseil Départemental (Général à l’époque), *La Lyre a intégré le \"Schéma départemental de Développement des Enseignements Artistiques \".\nLa Charte qui l’accompagne impose une ligne directrice, et est un gage de la qualité de l’enseignement offert par La Lyre, en la situant au niveau des Conservatoires municipaux de Musique ! Son but est de dynamiser une culture vivante, équitablement répartie sur tout le territoire et accessible à tous en Haute-Marne. La Lyre conforte ainsi son rôle porteur de projets auprès du public scolaire.\nTous les acteurs de l’Association associée, ici donc, La Lyre, sont directement concernés et impliqués, par le Plan de Formation Pédagogique mis en place.\nLe concert annuel de 2007 fut prétexte à mettre à l'honneur les orchestres d'élèves, au même titre que l'Harmonie: Orchestre A, Orchestre B, Improvisation, Orchestre ZEN ont fait la première partie de la soirée.\n2008 a vu la création de la classe de contrebasses à cordes, puis a renoué avec le concert spectacle: une allégorie autour de la magie, des sorciers et du fantastique, thème qui colle parfaitement avec Chalindrey, pays sorcier et son diable du Foultot.",
        era: 'modern',
        icon: Users
    },
    {
        year: "2009 - 2025",
        title: "Vingt ans de direction",
        content: "2009 fut une année importante pour notre Directrice et Chef d'Orchestres: elle a comptabilisé 20 ans de direction!\n20 années de passion, d'énergie donnée sans compter, de réussite et d'évolution de notre association!\nCet anniversaire coïncidait avec la Fête de Sainte Cécile: comme Marie-Christine n'aime rien plus que de mettre ses orchestres à l'honneur, les formations d'élèves ont participé à la célébration de la cérémonie, en compagnie du Grand Orchestre d'Harmonie, pour deux œuvres au programme.\nCette expérience s’est répétée plusieurs années, puis s’est arrêtée par….manque de place dans l’église de Chalindrey pour y accueillir quelques 100 musiciens…\nMichel Gérard a pris les rênes de La Lyre en octobre 2012. Membre du Conseil d’Administration depuis 1992, il a pris à bras le corps les évolutions rendues obligatoires ces dernières années, par les nouvelles législations !\nIl s’est ainsi « attelé » à la mise en place complète de la « Convention Collective de l’Animation », à l’obtention de la « Reconnaissance d’intérêt Général», ainsi qu’à l’Agrément Jeunesse et Sport, et a fait de La Lyre une Association ayant le droit de fournir des reçus fiscaux !\nDans « l’air du temps », il a mis en place des Mécénats, apportant une bouffée d’oxygène financière à La Lyre.\nTout en perpétuant le stage, dont 2025 a fêté la 30ème édition, et en organisant avec Marie-Christine Rémongin et Jérôme Guérin, le voyage à La Réunion de Février 2018",
        era: 'modern',
        icon: Star
    },
    {
        year: "2018 - 2022",
        title: "Et une création mondiale",
        content: "2018, Comme tous ses confrères chef d’orchestre, Marie-Christine Rémongin rêve d’une œuvre qui serait spécialement composée pour sa formation ! « L’Union faisant la force », le projet est proposé aux deux autres Associations musicales de la Communauté de Communes des Savoir Faire (CCSF) : La Concorde de Bourbonne-les-Bains et les Fa-sonneurs du Pays Vannier.\nAvec le soutien d’Arts Vivants 52(le Département), de la CCSF, Marie-Christine, cheville ouvrière à l’initiative de l’entreprise, prend contact avec Thierry Deleruyelle, jeune compositeur français, de renommée mondiale.\nL’aventure est lancée : une pièce d’une dizaine de minute est demandée à Thierry Deleruyelle. Editée par la maison De Haske, cette pièce musicale sur le Territoire intercommunal des Savoir Faire peut désormais être interprétée aux quatre coins du monde et faire connaître notre région bien au-delà de nos frontières.\n« La Symphonie des Savoir Faire » sera créée en première mondiale, au Centre Socio Culturel de Chalindrey, le 03 avril 2022, interprétée par les 3 harmonies de Chalindrey, Bourbonne-les-Bains et du Pays Vannier.\nDepuis cet évènement, les orchestres d’élèves portent le nom de « Chaudron », « Grimoire », et « Sortilèges », histoire de coller avec La Symphonie des Savoir Faire », les « Sorciers de Chalindrey » et leur diable du Foultot !",
        era: 'modern',
        icon: Music
    },
    {
        year: "2021 - 2023",
        title: "A suivre...",
        content: "En 2021, La Lyre comptabilisait 135 années d’existence : un anniversaire marqué par la parution d’un ouvrage : « De la Cécilienne à La Lyre de Chalindrey ».\nMarie-Christine Rémongin, en cette année 2023, le 31 mai, elle s’est vu décerner les palmes Académiques, octroyées par le Ministère de l’Education Nationale.\nA suivre…",
        era: 'modern',
        icon: Star
    }
];

const TimelineCard = ({ item }: { item: HistoryEvent }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const shouldTruncate = item.content.length > 200;

    // Dynamic Styles based on Era
    let cardStyle = "";
    let dateStyle = "";
    let buttonStyle = "";

    switch (item.era) {
        case 'vintage':
            cardStyle = "bg-[#f4e4bc] border-2 border-[#8b5a2b] shadow-[4px_4px_0px_0px_rgba(139,90,43,0.3)] font-serif text-[#5c3a1e]";
            dateStyle = "text-[#8b5a2b] font-bold font-serif tracking-widest border-b-2 border-[#8b5a2b] inline-block mb-2";
            buttonStyle = "text-[#8b5a2b] hover:text-[#5c3a1e] font-serif";
            break;
        case 'retro':
            cardStyle = "bg-slate-100 border-2 border-slate-800 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] grayscale font-mono text-slate-800";
            dateStyle = "bg-slate-800 text-white px-2 py-1 font-mono text-sm inline-block mb-3";
            buttonStyle = "text-slate-800 hover:text-black font-mono";
            break;
        case 'classic':
            cardStyle = "bg-white border-t-4 border-indigo-600 shadow-xl font-sans text-slate-700";
            dateStyle = "text-indigo-600 font-bold text-lg mb-2 block uppercase tracking-wide";
            buttonStyle = "text-indigo-600 hover:text-indigo-800 font-semibold";
            break;
        case 'modern':
            cardStyle = "bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-teal-500/20 rounded-2xl font-inter text-slate-600";
            dateStyle = "text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-600 font-bold text-xl mb-2 inline-block";
            buttonStyle = "text-teal-600 hover:text-teal-800 font-medium";
            break;
    }

    const displayText = isExpanded ? item.content : item.content.slice(0, 200) + (shouldTruncate ? "..." : "");

    return (
        <div className={`p-5 md:p-6 relative ${cardStyle} transition-all duration-300 hover:scale-[1.01]`}>
            <div className={`md:hidden ${dateStyle}`}>{item.year}</div>
            <h3 className={`text-2xl font-bold mb-4 ${item.era === 'vintage' ? 'font-serif' : 'font-poppins'}`}>
                {item.title}
            </h3>

            <div className={`leading-relaxed text-sm md:text-base opacity-90 whitespace-pre-wrap relative`}>
                {displayText}
                {!isExpanded && shouldTruncate && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/0 to-transparent pointer-events-none" />
                )}
            </div>

            {shouldTruncate && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`mt-4 flex items-center gap-1 text-sm ${buttonStyle} focus:outline-none transition-colors`}
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="w-4 h-4" />
                            Réduire
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-4 h-4" />
                            Lire la suite
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

const HistoryTimeline = () => {
    return (
        <section className="py-12 bg-white overflow-hidden relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h2 className="font-poppins font-bold text-3xl md:text-5xl text-slate-800 mb-4">Notre Histoire</h2>
                    <p className="text-slate-600 max-w-2xl mx-auto">De la "Cécilienne" à La Lyre d'aujourd'hui, voyagez à travers 139 ans de passion musicale.</p>
                </div>

                <div className="relative">
                    {/* Central Line */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-px border-l-2 border-dashed border-slate-300 hidden md:block" />

                    <div className="space-y-8 md:space-y-12">
                        {historyData.map((item, index) => {
                            const isEven = index % 2 === 0;
                            const Icon = item.icon || Music;
                            let badgeStyle = "";

                            switch (item.era) {
                                case 'vintage':
                                    badgeStyle = "bg-[#f9f5eb] text-[#8b5a2b] border-2 border-[#8b5a2b] font-serif tracking-wider";
                                    break;
                                case 'retro':
                                    badgeStyle = "bg-slate-800 text-white border-2 border-slate-600 font-mono";
                                    break;
                                case 'classic':
                                    badgeStyle = "bg-indigo-600 text-white border-2 border-indigo-400 font-sans tracking-wide";
                                    break;
                                case 'modern':
                                    badgeStyle = "bg-white text-teal-600 border-2 border-teal-500 font-bold shadow-[0_0_15px_rgba(20,184,166,0.3)]";
                                    break;
                            }

                            return (
                                <div key={index} className={`relative flex flex-col md:flex-row items-center ${isEven ? 'md:flex-row-reverse' : ''}`}>

                                    {/* Timeline Date Badge (Desktop) */}
                                    <div className={`absolute left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full flex items-center justify-center z-10 hidden md:flex whitespace-nowrap shadow-md ${badgeStyle}`}>
                                        <span className="text-sm font-bold">{item.year}</span>
                                    </div>

                                    {/* Image or Spacer for Desktop Layout */}
                                    <div className="flex-1 w-full hidden md:flex justify-center px-4 md:px-24 items-center">
                                        {item.image ? (
                                            <div className="relative w-full h-48 max-w-md rounded-2xl overflow-hidden shadow-xl transform hover:scale-[1.02] transition-transform duration-500 group">
                                                <img
                                                    src={`${BASE_URL}/uploads/${item.image}`}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                {/* Vintage Overlay Effect */}
                                                {(item.era === 'vintage' || item.era === 'retro') && <div className="absolute inset-0 bg-sepia-[.4] pointer-events-none mix-blend-multiply opacity-60"></div>}
                                            </div>
                                        ) : (
                                            <div className="w-full" />
                                        )}
                                    </div>

                                    {/* Content Card */}
                                    <div className="flex-1 w-full px-4 md:px-24">
                                        <TimelineCard item={item} />
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HistoryTimeline;
