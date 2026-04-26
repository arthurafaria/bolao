const stadiums: Record<string, string> = {
	"athletico-pr": "Arena da Baixada",
	"athletico paranaense": "Arena da Baixada",
	"club athletico paranaense": "Arena da Baixada",
	paranaense: "Arena da Baixada",
	"atlético-mg": "Arena MRV",
	"atletico-mg": "Arena MRV",
	bahia: "Arena Fonte Nova",
	botafogo: "Nilton Santos",
	ceara: "Arena Castelão",
	ceará: "Arena Castelão",
	corinthians: "Neo Química Arena",
	cruzeiro: "Mineirão",
	flamengo: "Maracanã",
	fluminense: "Maracanã",
	fortaleza: "Arena Castelão",
	gremio: "Arena do Grêmio",
	grêmio: "Arena do Grêmio",
	internacional: "Beira-Rio",
	juventude: "Alfredo Jaconi",
	mirassol: "Campos Maia",
	palmeiras: "Allianz Parque",
	bragantino: "Nabi Abi Chedid",
	"red bull bragantino": "Nabi Abi Chedid",
	mineiro: "Arena MRV",
	"atlético mineiro": "Arena MRV",
	"atletico mineiro": "Arena MRV",
	"clube atlético mineiro": "Arena MRV",
	"clube atletico mineiro": "Arena MRV",
	"clube do remo": "Baenão",
	remo: "Baenão",
	santos: "Vila Belmiro",
	"são paulo": "MorumBIS",
	"sao paulo": "MorumBIS",
	sport: "Ilha do Retiro",
	vasco: "São Januário",
	vitoria: "Barradão",
	vitória: "Barradão",
};

function normalizeTeamName(name: string): string {
	return name.trim().toLowerCase();
}

export function getStadium(shortName?: string, name?: string): string | null {
	const keys = [shortName, name]
		.filter(Boolean)
		.map((key) => normalizeTeamName(key ?? ""));
	for (const key of keys) {
		if (stadiums[key]) return stadiums[key];
	}
	return null;
}
