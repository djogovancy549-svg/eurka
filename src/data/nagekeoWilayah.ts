export interface KecamatanDesa {
  kecamatan: string;
  desaList: string[];
}

export const DEFAULT_NAGEKEO_WILAYAH: KecamatanDesa[] = [
  {
    kecamatan: 'Aesesa',
    desaList: [
      'Kelurahan Danga',
      'Kelurahan Lape',
      'Kelurahan Towak',
      'Desa Aeramo',
      'Desa Marapokot',
      'Desa Nangadhero',
      'Desa Olaia',
      'Desa Tedamude',
      'Desa Tonggurambang',
      'Desa Waekutu',
      'Desa Nangamboa',
      'Desa Mbay I',
      'Desa Mbay II',
      'Desa Tedakisa'
    ]
  },
  {
    kecamatan: 'Aesesa Selatan',
    desaList: [
      'Desa Renduteno',
      'Desa Rendututu',
      'Desa Rendubutowe',
      'Desa Wajomara',
      'Desa Langedha',
      'Desa Labolewa',
      'Desa Tendatoto'
    ]
  },
  {
    kecamatan: 'Boawae',
    desaList: [
      'Kelurahan Nangaroro (Boawae)',
      'Kelurahan Rega',
      'Desa Aloripit',
      'Desa Dhereisa',
      'Desa Fataatu',
      'Desa Fataele',
      'Desa Gero',
      'Desa Kelewae',
      'Desa Kelimado',
      'Desa Leguderu',
      'Desa Mulakoli',
      'Desa Naelengko',
      'Desa Nageoga',
      'Desa Nagerawe',
      'Desa Raja',
      'Desa Raja Selatan',
      'Desa Raja Timur',
      'Desa Rigi',
      'Desa Rowa',
      'Desa Soba',
      'Desa Wea Au',
      'Desa Wolowea',
      'Desa Wolowea Barat',
      'Desa Wolowea Timur',
      'Desa Gero Tengah',
      'Desa Ratongambo',
      'Desa Olakile'
    ]
  },
  {
    kecamatan: 'Mauponggo',
    desaList: [
      'Kelurahan Mauponggo',
      'Desa Aewora',
      'Desa Bela',
      'Desa Jawapisa',
      'Desa Keli',
      'Desa Kotagana',
      'Desa Lajawajo',
      'Desa Lodaolo',
      'Desa Lokalaba',
      'Desa Maukeli',
      'Desa Mauponggo',
      'Desa Selalejo',
      'Desa Selalejo Timur',
      'Desa Ua',
      'Desa Utetoto',
      'Desa Wolokisa',
      'Desa Wolomae',
      'Desa Wolotelu',
      'Desa Woloede',
      'Desa Sawu',
      'Desa Witurombaua Mauponggo'
    ]
  },
  {
    kecamatan: 'Nangaroro',
    desaList: [
      'Kelurahan Nangaroro',
      'Desa Bagesole',
      'Desa Degulesa',
      'Desa Keli Nangaroro',
      'Desa Podenura',
      'Desa Riti',
      'Desa Tonggo',
      'Desa Ulupulu',
      'Desa Ulupulu I',
      'Desa Woewolo',
      'Desa Woewutu',
      'Desa Utetoto Barat',
      'Desa Nangaroro Barat',
      'Desa Pagomogo'
    ]
  },
  {
    kecamatan: 'Keo Tengah',
    desaList: [
      'Desa Kotowuji Barat',
      'Desa Kotowuji Timur',
      'Desa Keliwhero',
      'Desa Ladolima',
      'Desa Ladolima Timur',
      'Desa Ladolima Utara',
      'Desa Lewangera',
      'Desa Mbaenuamuri',
      'Desa Ngera',
      'Desa Pautola',
      'Desa Udiworowatu',
      'Desa Wajo',
      'Desa Wajo Barat',
      'Desa Wajo Timur',
      'Desa Witurombaua',
      'Desa Kotowuji Tengah'
    ]
  },
  {
    kecamatan: 'Wolowae',
    desaList: [
      'Desa Anakoli',
      'Desa Tendakinde',
      'Desa Tendatoto Wolowae',
      'Desa Totomala',
      'Desa Natatoto'
    ]
  }
];

export const getAllDesaFlatList = (wilayahList: KecamatanDesa[] = DEFAULT_NAGEKEO_WILAYAH): { desa: string; kecamatan: string }[] => {
  const result: { desa: string; kecamatan: string }[] = [];
  wilayahList.forEach(k => {
    k.desaList.forEach(d => {
      result.push({ desa: d, kecamatan: k.kecamatan });
    });
  });
  return result;
};

export const countTotalDesa = (wilayahList: KecamatanDesa[] = DEFAULT_NAGEKEO_WILAYAH): number => {
  return wilayahList.reduce((acc, k) => acc + k.desaList.length, 0);
};
