// Location Controller for Nepal Administrative Divisions
// Uses nepal-administrative-data package for complete data

import https from 'https';
import { 
  getProvinces as getNepalProvinces, 
  getDistricts as getNepalDistricts, 
  getDistrictsByProvince as getNepalDistrictsByProvince, 
  getGaPasByDistrict as getNepalGaPasByDistrict,
  getGaPaDetails as getNepalGaPaDetails,
  getDistrictDetails as getNepalDistrictDetails
} from 'nepal-administrative-data';

// Cache for fetched data
let dataCache = {
  municipalities: {},
  wards: {},
  districtCodeMap: null, // Will store mapping of our IDs to package codes
  lastFetch: null,
  cacheDuration: 24 * 60 * 60 * 1000 // 24 hours
};

// Map our district IDs (1-78) to nepal-administrative-data district codes (101+)
// The package uses codes starting from 101 for districts
const createDistrictCodeMap = () => {
  if (dataCache.districtCodeMap) {
    return dataCache.districtCodeMap;
  }
  
  const map = {};
  const allDistricts = getNepalDistricts('en');
  
  // Our district IDs are sequential 1-78, package codes start from 101
  // We'll match by name since the order should be similar
  allDistricts.forEach((district, index) => {
    // District codes in package: 101, 102, 103, etc.
    // Our IDs: 1, 2, 3, etc.
    // So code = 100 + (index + 1) approximately, but let's match by name
    const ourDistrict = Object.values(nepalLocations.districts)
      .flat()
      .find(d => d.name === district.name || d.nameNp === district.name);
    
    if (ourDistrict) {
      map[ourDistrict.id] = district.code;
    } else {
      // Fallback: assume sequential mapping (code = 100 + id)
      map[index + 1] = district.code;
    }
  });
  
  dataCache.districtCodeMap = map;
  return map;
};

// Helper function to fetch JSON from URL
const fetchJSON = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
};

// Fetch municipalities from local-states-nepal GitHub repository
const fetchMunicipalitiesFromGitHub = async (districtIdNum) => {
  try {
    // Try to fetch from local-states-nepal repository
    const url = 'https://raw.githubusercontent.com/sagautam5/local-states-nepal/master/dataset/municipality.json';
    const data = await fetchJSON(url);
    
    if (Array.isArray(data)) {
      // Find our district name to match
      const ourDistrict = Object.values(nepalLocations.districts)
        .flat()
        .find(d => d.id === districtIdNum);
      
      if (ourDistrict) {
        // Filter municipalities by district name (matching logic depends on data structure)
        const municipalities = data
          .filter(m => {
            const districtName = m.district_name || m.district || m.districtName || '';
            return districtName.toLowerCase().includes(ourDistrict.name.toLowerCase()) ||
                   ourDistrict.name.toLowerCase().includes(districtName.toLowerCase());
          })
          .map((m, index) => ({
            id: m.id || m.municipality_id || index + 1000,
            name: m.name || m.municipality_name || m.municipality || '',
            nameNp: m.name_np || m.nameNp || m.municipality_np || '',
            wards: m.wards || m.ward_count || m.totalWard || 9
          }));
        
        if (municipalities.length > 0) {
          return municipalities;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.log('Error fetching from GitHub:', error.message);
    return null;
  }
};

// Nepal Administrative Data Structure (Basic data - provinces and districts)

const nepalLocations = {
  provinces: [
    { id: 1, name: 'Koshi', nameNp: 'कोशी' },
    { id: 2, name: 'Madhesh', nameNp: 'मधेश' },
    { id: 3, name: 'Bagmati', nameNp: 'बागमती' },
    { id: 4, name: 'Gandaki', nameNp: 'गण्डकी' },
    { id: 5, name: 'Lumbini', nameNp: 'लुम्बिनी' },
    { id: 6, name: 'Karnali', nameNp: 'कर्णाली' },
    { id: 7, name: 'Sudurpashchim', nameNp: 'सुदूरपश्चिम' }
  ],
  districts: {
    1: [ // Koshi Province
      { id: 1, name: 'Bhojpur', nameNp: 'भोजपुर' },
      { id: 2, name: 'Dhankuta', nameNp: 'धनकुटा' },
      { id: 3, name: 'Ilam', nameNp: 'इलाम' },
      { id: 4, name: 'Jhapa', nameNp: 'झापा' },
      { id: 5, name: 'Khotang', nameNp: 'खोटाङ' },
      { id: 6, name: 'Morang', nameNp: 'मोरङ' },
      { id: 7, name: 'Okhaldhunga', nameNp: 'ओखलढुङ्गा' },
      { id: 8, name: 'Panchthar', nameNp: 'पाँचथर' },
      { id: 9, name: 'Sankhuwasabha', nameNp: 'सङ्खुवासभा' },
      { id: 10, name: 'Solukhumbu', nameNp: 'सोलुखुम्बु' },
      { id: 11, name: 'Sunsari', nameNp: 'सुनसरी' },
      { id: 12, name: 'Taplejung', nameNp: 'ताप्लेजुङ' },
      { id: 13, name: 'Terhathum', nameNp: 'तेह्रथुम' },
      { id: 14, name: 'Udayapur', nameNp: 'उदयपुर' }
    ],
    2: [ // Madhesh Province
      { id: 15, name: 'Bara', nameNp: 'बारा' },
      { id: 16, name: 'Dhanusha', nameNp: 'धनुषा' },
      { id: 17, name: 'Mahottari', nameNp: 'महोत्तरी' },
      { id: 18, name: 'Parsa', nameNp: 'पर्सा' },
      { id: 19, name: 'Rautahat', nameNp: 'रौतहट' },
      { id: 20, name: 'Saptari', nameNp: 'सप्तरी' },
      { id: 21, name: 'Sarlahi', nameNp: 'सर्लाही' },
      { id: 22, name: 'Siraha', nameNp: 'सिराहा' }
    ],
    3: [ // Bagmati Province
      { id: 23, name: 'Bhaktapur', nameNp: 'भक्तपुर' },
      { id: 24, name: 'Chitwan', nameNp: 'चितवन' },
      { id: 25, name: 'Dhading', nameNp: 'धादिङ' },
      { id: 26, name: 'Dolakha', nameNp: 'दोलखा' },
      { id: 27, name: 'Kathmandu', nameNp: 'काठमाडौं' },
      { id: 28, name: 'Kavrepalanchok', nameNp: 'काभ्रेपलाञ्चोक' },
      { id: 29, name: 'Lalitpur', nameNp: 'ललितपुर' },
      { id: 30, name: 'Makwanpur', nameNp: 'मकवानपुर' },
      { id: 31, name: 'Nuwakot', nameNp: 'नुवाकोट' },
      { id: 32, name: 'Ramechhap', nameNp: 'रामेछाप' },
      { id: 33, name: 'Rasuwa', nameNp: 'रसुवा' },
      { id: 34, name: 'Sindhuli', nameNp: 'सिन्धुली' },
      { id: 35, name: 'Sindhupalchok', nameNp: 'सिन्धुपाल्चोक' }
    ],
    4: [ // Gandaki Province
      { id: 36, name: 'Baglung', nameNp: 'बागलुङ' },
      { id: 37, name: 'Gorkha', nameNp: 'गोरखा' },
      { id: 38, name: 'Kaski', nameNp: 'कास्की' },
      { id: 39, name: 'Lamjung', nameNp: 'लमजुङ' },
      { id: 40, name: 'Manang', nameNp: 'मनाङ' },
      { id: 41, name: 'Mustang', nameNp: 'मुस्ताङ' },
      { id: 42, name: 'Myagdi', nameNp: 'म्याग्दी' },
      { id: 43, name: 'Nawalpur', nameNp: 'नवलपुर' },
      { id: 44, name: 'Parbat', nameNp: 'पर्वत' },
      { id: 45, name: 'Syangja', nameNp: 'स्याङ्जा' },
      { id: 46, name: 'Tanahun', nameNp: 'तनहुँ' }
    ],
    5: [ // Lumbini Province
      { id: 47, name: 'Arghakhanchi', nameNp: 'अर्घाखाँची' },
      { id: 48, name: 'Banke', nameNp: 'बाँके' },
      { id: 49, name: 'Bardiya', nameNp: 'बर्दिया' },
      { id: 50, name: 'Dang', nameNp: 'दाङ' },
      { id: 51, name: 'Gulmi', nameNp: 'गुल्मी' },
      { id: 52, name: 'Kapilvastu', nameNp: 'कपिलवस्तु' },
      { id: 53, name: 'Nawalparasi East', nameNp: 'नवलपरासी पूर्व' },
      { id: 54, name: 'Palpa', nameNp: 'पाल्पा' },
      { id: 55, name: 'Parasi', nameNp: 'परासी' },
      { id: 56, name: 'Pyuthan', nameNp: 'प्यूठान' },
      { id: 57, name: 'Rolpa', nameNp: 'रोल्पा' },
      { id: 58, name: 'Rukum East', nameNp: 'रुकुम पूर्व' },
      { id: 59, name: 'Rupandehi', nameNp: 'रुपन्देही' }
    ],
    6: [ // Karnali Province
      { id: 60, name: 'Dailekh', nameNp: 'दैलेख' },
      { id: 61, name: 'Dolpa', nameNp: 'डोल्पा' },
      { id: 62, name: 'Humla', nameNp: 'हुम्ला' },
      { id: 63, name: 'Jajarkot', nameNp: 'जाजरकोट' },
      { id: 64, name: 'Jumla', nameNp: 'जुम्ला' },
      { id: 65, name: 'Kalikot', nameNp: 'कालिकोट' },
      { id: 66, name: 'Mugu', nameNp: 'मुगु' },
      { id: 67, name: 'Rukum West', nameNp: 'रुकुम पश्चिम' },
      { id: 68, name: 'Salyan', nameNp: 'सल्यान' },
      { id: 69, name: 'Surkhet', nameNp: 'सुर्खेत' }
    ],
    7: [ // Sudurpashchim Province
      { id: 70, name: 'Achham', nameNp: 'अछाम' },
      { id: 71, name: 'Baitadi', nameNp: 'बैतडी' },
      { id: 72, name: 'Bajhang', nameNp: 'बझाङ' },
      { id: 73, name: 'Bajura', nameNp: 'बाजुरा' },
      { id: 74, name: 'Dadeldhura', nameNp: 'डडेलधुरा' },
      { id: 75, name: 'Darchula', nameNp: 'दार्चुला' },
      { id: 76, name: 'Doti', nameNp: 'डोटी' },
      { id: 77, name: 'Kailali', nameNp: 'कैलाली' },
      { id: 78, name: 'Kanchanpur', nameNp: 'कञ्चनपुर' }
    ]
  },
  // Municipalities by district
  municipalities: {
    // Kathmandu District (27)
    27: [
      { id: 1, name: 'Kathmandu Metropolitan City', nameNp: 'काठमाडौं महानगरपालिका', wards: 32 },
      { id: 2, name: 'Budhanilkantha Municipality', nameNp: 'बुढानिलकण्ठ नगरपालिका', wards: 9 },
      { id: 3, name: 'Chandragiri Municipality', nameNp: 'चन्द्रागिरी नगरपालिका', wards: 15 },
      { id: 4, name: 'Dakshinkali Municipality', nameNp: 'दक्षिणकाली नगरपालिका', wards: 9 },
      { id: 5, name: 'Gokarneshwor Municipality', nameNp: 'गोकर्णेश्वर नगरपालिका', wards: 9 },
      { id: 6, name: 'Kageshwori Manohara Municipality', nameNp: 'कागेश्वरी मनोहरा नगरपालिका', wards: 10 },
      { id: 7, name: 'Kirtipur Municipality', nameNp: 'कीर्तिपुर नगरपालिका', wards: 10 },
      { id: 8, name: 'Nagarjun Municipality', nameNp: 'नागार्जुन नगरपालिका', wards: 9 },
      { id: 9, name: 'Shankharapur Municipality', nameNp: 'शंखरापुर नगरपालिका', wards: 9 },
      { id: 10, name: 'Tarakeshwor Municipality', nameNp: 'तारकेश्वर नगरपालिका', wards: 9 },
      { id: 11, name: 'Tokha Municipality', nameNp: 'टोखा नगरपालिका', wards: 9 }
    ],
    // Lalitpur District (29)
    29: [
      { id: 12, name: 'Lalitpur Metropolitan City', nameNp: 'ललितपुर महानगरपालिका', wards: 29 },
      { id: 13, name: 'Godawari Municipality', nameNp: 'गोदावरी नगरपालिका', wards: 14 },
      { id: 14, name: 'Mahalaxmi Municipality', nameNp: 'महालक्ष्मी नगरपालिका', wards: 10 },
      { id: 15, name: 'Konjyosom Rural Municipality', nameNp: 'कोंज्योसोम गाउँपालिका', wards: 5 },
      { id: 16, name: 'Bagmati Rural Municipality', nameNp: 'बागमती गाउँपालिका', wards: 5 },
      { id: 17, name: 'Mahankal Rural Municipality', nameNp: 'महाङ्काल गाउँपालिका', wards: 6 }
    ],
    // Bhaktapur District (23)
    23: [
      { id: 18, name: 'Bhaktapur Municipality', nameNp: 'भक्तपुर नगरपालिका', wards: 10 },
      { id: 19, name: 'Changunarayan Municipality', nameNp: 'चाँगुनारायण नगरपालिका', wards: 9 },
      { id: 20, name: 'Madhyapur Thimi Municipality', nameNp: 'मध्यपुर थिमी नगरपालिका', wards: 9 },
      { id: 21, name: 'Suryabinayak Municipality', nameNp: 'सूर्यविनायक नगरपालिका', wards: 11 }
    ],
    // Chitwan District (24)
    24: [
      { id: 22, name: 'Bharatpur Metropolitan City', nameNp: 'भरतपुर महानगरपालिका', wards: 29 },
      { id: 23, name: 'Kalika Municipality', nameNp: 'कालिका नगरपालिका', wards: 9 },
      { id: 24, name: 'Khairhani Municipality', nameNp: 'खैरहनी नगरपालिका', wards: 9 },
      { id: 25, name: 'Madi Municipality', nameNp: 'माडी नगरपालिका', wards: 9 },
      { id: 26, name: 'Ratnanagar Municipality', nameNp: 'रत्ननगर नगरपालिका', wards: 9 },
      { id: 27, name: 'Rapti Municipality', nameNp: 'राप्ती नगरपालिका', wards: 9 },
      { id: 28, name: 'Ichchhakamana Rural Municipality', nameNp: 'इच्छाकामना गाउँपालिका', wards: 5 }
    ],
    // Kaski District (38) - Pokhara
    38: [
      { id: 29, name: 'Pokhara Metropolitan City', nameNp: 'पोखरा महानगरपालिका', wards: 33 },
      { id: 30, name: 'Annapurna Rural Municipality', nameNp: 'अन्नपूर्ण गाउँपालिका', wards: 6 },
      { id: 31, name: 'Machhapuchhre Rural Municipality', nameNp: 'माछापुछ्रे गाउँपालिका', wards: 6 },
      { id: 32, name: 'Madi Rural Municipality', nameNp: 'माडी गाउँपालिका', wards: 5 },
      { id: 33, name: 'Rupa Rural Municipality', nameNp: 'रुपा गाउँपालिका', wards: 5 }
    ],
    // Morang District (6)
    6: [
      { id: 34, name: 'Biratnagar Metropolitan City', nameNp: 'विराटनगर महानगरपालिका', wards: 19 },
      { id: 35, name: 'Belbari Municipality', nameNp: 'बेलबारी नगरपालिका', wards: 9 },
      { id: 36, name: 'Biratnagar Sub-Metropolitan City', nameNp: 'विराटनगर उपमहानगरपालिका', wards: 19 },
      { id: 37, name: 'Budhiganga Rural Municipality', nameNp: 'बुढीगंगा गाउँपालिका', wards: 6 },
      { id: 38, name: 'Dhanpalthan Rural Municipality', nameNp: 'धनपालथान गाउँपालिका', wards: 6 },
      { id: 39, name: 'Gramthan Rural Municipality', nameNp: 'ग्रामथान गाउँपालिका', wards: 6 },
      { id: 40, name: 'Jahada Rural Municipality', nameNp: 'जहदा गाउँपालिका', wards: 6 },
      { id: 41, name: 'Kanepokhari Rural Municipality', nameNp: 'कानेपोखरी गाउँपालिका', wards: 6 },
      { id: 42, name: 'Katahari Rural Municipality', nameNp: 'कटहरी गाउँपालिका', wards: 6 },
      { id: 43, name: 'Kerabari Rural Municipality', nameNp: 'केराबारी गाउँपालिका', wards: 6 },
      { id: 44, name: 'Letang Municipality', nameNp: 'लेटाङ नगरपालिका', wards: 9 },
      { id: 45, name: 'Miklajung Rural Municipality', nameNp: 'मिक्लाजुङ गाउँपालिका', wards: 6 },
      { id: 46, name: 'Patahrishanishchare Municipality', nameNp: 'पथरिशनिश्चरे नगरपालिका', wards: 9 },
      { id: 47, name: 'Rangeli Municipality', nameNp: 'रंगेली नगरपालिका', wards: 9 },
      { id: 48, name: 'Ratuwamai Municipality', nameNp: 'रतुवामाई नगरपालिका', wards: 9 },
      { id: 49, name: 'Sundarharaicha Municipality', nameNp: 'सुन्दरहरैचा नगरपालिका', wards: 9 },
      { id: 50, name: 'Sunbarshi Municipality', nameNp: 'सुनबर्षी नगरपालिका', wards: 9 },
      { id: 51, name: 'Urlabari Municipality', nameNp: 'उर्लाबारी नगरपालिका', wards: 9 }
    ],
    // Jhapa District (4)
    4: [
      { id: 52, name: 'Bhadrapur Municipality', nameNp: 'भद्रपुर नगरपालिका', wards: 9 },
      { id: 53, name: 'Birtamod Municipality', nameNp: 'विर्तामोड नगरपालिका', wards: 9 },
      { id: 54, name: 'Buddhashanti Rural Municipality', nameNp: 'बुद्धशान्ति गाउँपालिका', wards: 6 },
      { id: 55, name: 'Damak Municipality', nameNp: 'दमक नगरपालिका', wards: 9 },
      { id: 56, name: 'Gauradaha Municipality', nameNp: 'गौरादह नगरपालिका', wards: 9 },
      { id: 57, name: 'Gaurigunj Rural Municipality', nameNp: 'गौरीगुञ्ज गाउँपालिका', wards: 6 },
      { id: 58, name: 'Haldibari Rural Municipality', nameNp: 'हल्दीबारी गाउँपालिका', wards: 6 },
      { id: 59, name: 'Jhapa Rural Municipality', nameNp: 'झापा गाउँपालिका', wards: 6 },
      { id: 60, name: 'Kachankawal Rural Municipality', nameNp: 'कचनकवल गाउँपालिका', wards: 6 },
      { id: 61, name: 'Kamal Rural Municipality', nameNp: 'कमल गाउँपालिका', wards: 6 },
      { id: 62, name: 'Kankai Municipality', nameNp: 'कन्काई नगरपालिका', wards: 9 },
      { id: 63, name: 'Mechinagar Municipality', nameNp: 'मेचीनगर नगरपालिका', wards: 9 },
      { id: 64, name: 'Shivasatakshi Municipality', nameNp: 'शिवसताक्षी नगरपालिका', wards: 9 }
    ]
  }
};

// Helper function to generate wards for a municipality
const generateWards = (municipality) => {
  const wards = [];
  const wardCount = municipality.wards || 9; // Default to 9 if not specified
  for (let i = 1; i <= wardCount; i++) {
    wards.push({
      id: i,
      name: `Ward ${i}`,
      nameNp: `वडा ${i}`,
      municipalityId: municipality.id
    });
  }
  return wards;
};

// Get all provinces
export const getProvinces = async (req, res) => {
  try {
    const { lang = 'en' } = req.query;
    
    const provinces = nepalLocations.provinces.map(province => ({
      id: province.id,
      name: lang === 'np' ? province.nameNp : province.name,
      nameNp: province.nameNp,
      nameEn: province.name
    }));

    res.status(200).json({
      success: true,
      data: provinces
    });
  } catch (error) {
    console.error('Error fetching provinces:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch provinces',
      error: error.message
    });
  }
};

// Get districts by province
export const getDistrictsByProvince = async (req, res) => {
  try {
    const { provinceId } = req.params;
    const { lang = 'en' } = req.query;

    const provinceIdNum = parseInt(provinceId);
    if (!nepalLocations.districts[provinceIdNum]) {
      return res.status(404).json({
        success: false,
        message: 'Province not found'
      });
    }

    const districts = nepalLocations.districts[provinceIdNum].map(district => ({
      id: district.id,
      name: lang === 'np' ? district.nameNp : district.name,
      nameNp: district.nameNp,
      nameEn: district.name
    }));

    res.status(200).json({
      success: true,
      data: districts
    });
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch districts',
      error: error.message
    });
  }
};

// Get municipalities by district
export const getMunicipalitiesByDistrict = async (req, res) => {
  try {
    const { districtId } = req.params;
    const { lang = 'en' } = req.query;

    const districtIdNum = parseInt(districtId);
    
    // Check cache first
    if (dataCache.municipalities[districtIdNum]) {
      const municipalities = dataCache.municipalities[districtIdNum].map(municipality => ({
        id: municipality.id,
        name: lang === 'np' ? municipality.nameNp : municipality.name,
        nameNp: municipality.nameNp,
        nameEn: municipality.name,
        wards: municipality.wards || municipality.totalWard || 9
      }));

      return res.status(200).json({
        success: true,
        data: municipalities
      });
    }

    // Use nepal-administrative-data package
    try {
      // Find our district by ID
      const ourDistrict = Object.values(nepalLocations.districts)
        .flat()
        .find(d => d.id === districtIdNum);
      
      if (ourDistrict) {
        // Get all districts from package and match by name
        const allDistricts = getNepalDistricts('en');
        let matchedDistrict = allDistricts.find(d => {
          const nameMatch = d.name.toLowerCase() === ourDistrict.name.toLowerCase() ||
                           d.name.toLowerCase().includes(ourDistrict.name.toLowerCase()) ||
                           ourDistrict.name.toLowerCase().includes(d.name.toLowerCase());
          return nameMatch;
        });
        
        // If not found, try matching with Nepali name
        if (!matchedDistrict) {
          const allDistrictsNe = getNepalDistricts('ne');
          matchedDistrict = allDistrictsNe.find(d => {
            const nameMatch = d.name === ourDistrict.nameNp ||
                             d.name.includes(ourDistrict.nameNp) ||
                             ourDistrict.nameNp.includes(d.name);
            return nameMatch;
          });
          // If found by Nepali name, get the English version to get the code
          if (matchedDistrict) {
            matchedDistrict = allDistricts.find(d => d.code === matchedDistrict.code);
          }
        }
        
        if (matchedDistrict) {
          try {
            const gapas = getNepalGaPasByDistrict(matchedDistrict.code, lang === 'np' ? 'ne' : 'en');
            
            if (gapas && gapas.length > 0) {
              const municipalities = gapas.map((gapa) => ({
                id: gapa.code, // Use package code as ID
                name: gapa.name,
                nameNp: lang === 'np' ? gapa.name : (gapas.find(g => g.code === gapa.code && g.name !== gapa.name)?.name || ''),
                nameEn: lang === 'en' ? gapa.name : '',
                wards: gapa.totalWard || 9
              }));
              
              // Get Nepali names if English was used
              if (lang === 'en') {
                try {
                  const gapasNe = getNepalGaPasByDistrict(matchedDistrict.code, 'ne');
                  municipalities.forEach((municipality) => {
                    const neGapa = gapasNe.find(g => g.code === municipality.id);
                    if (neGapa) {
                      municipality.nameNp = neGapa.name;
                    }
                  });
                } catch (neError) {
                  console.log('Could not fetch Nepali names:', neError.message);
                }
              }
              
              // Cache the result
              dataCache.municipalities[districtIdNum] = municipalities;
              
              return res.status(200).json({
                success: true,
                data: municipalities
              });
            }
          } catch (gapaError) {
            console.log(`Error fetching GaPas for district ${matchedDistrict.code}:`, gapaError.message);
          }
        } else {
          console.log(`Could not match district ${ourDistrict.name} (ID: ${districtIdNum}) with package districts`);
        }
      }
    } catch (packageError) {
      console.error('Error using nepal-administrative-data package:', packageError.message);
    }

    // Fallback: Try fetching from local-states-nepal GitHub repository
    try {
      const githubMunicipalities = await fetchMunicipalitiesFromGitHub(districtIdNum);
      if (githubMunicipalities && githubMunicipalities.length > 0) {
        const formattedMunicipalities = githubMunicipalities.map(municipality => ({
          id: municipality.id,
          name: lang === 'np' ? (municipality.nameNp || municipality.name) : municipality.name,
          nameNp: municipality.nameNp || municipality.name,
          nameEn: municipality.name,
          wards: municipality.wards
        }));
        
        // Cache the result
        dataCache.municipalities[districtIdNum] = formattedMunicipalities;
        
        return res.status(200).json({
          success: true,
          data: formattedMunicipalities
        });
      }
    } catch (githubError) {
      console.log('Error fetching from GitHub repository:', githubError.message);
    }

    // Fallback to hardcoded data if available
    if (nepalLocations.municipalities && nepalLocations.municipalities[districtIdNum]) {
      const municipalities = nepalLocations.municipalities[districtIdNum].map(municipality => ({
        id: municipality.id,
        name: lang === 'np' ? municipality.nameNp : municipality.name,
        nameNp: municipality.nameNp,
        nameEn: municipality.name,
        wards: municipality.wards
      }));

      return res.status(200).json({
        success: true,
        data: municipalities
      });
    }

    // If no data found anywhere
    return res.status(200).json({
      success: true,
      data: [],
      message: 'Municipality data not available for this district. You can enter it manually in the street address field.'
    });
  } catch (error) {
    console.error('Error fetching municipalities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch municipalities',
      error: error.message
    });
  }
};

// Get wards by municipality
export const getWardsByMunicipality = async (req, res) => {
  try {
    const { municipalityId } = req.params;
    const { lang = 'en' } = req.query;

    const municipalityIdNum = parseInt(municipalityId);
    
    // Check cache first
    if (dataCache.wards[municipalityIdNum]) {
      const wards = dataCache.wards[municipalityIdNum].map(ward => ({
        id: ward.id,
        name: lang === 'np' ? ward.nameNp : ward.name,
        nameNp: ward.nameNp,
        nameEn: ward.name,
        municipalityId: ward.municipalityId
      }));

      return res.status(200).json({
        success: true,
        data: wards
      });
    }

    // Use nepal-administrative-data package
    try {
      // municipalityIdNum is actually the GaPa code from the package
      const gapaDetails = getNepalGaPaDetails(municipalityIdNum);
      
      if (gapaDetails && gapaDetails.totalWard) {
        const wards = [];
        for (let i = 1; i <= gapaDetails.totalWard; i++) {
          wards.push({
            id: i,
            name: `Ward ${i}`,
            nameNp: `वडा ${i}`,
            municipalityId: municipalityIdNum
          });
        }
        
        // Cache the result
        dataCache.wards[municipalityIdNum] = wards;

        const formattedWards = wards.map(ward => ({
          id: ward.id,
          name: lang === 'np' ? ward.nameNp : ward.name,
          nameNp: ward.nameNp,
          nameEn: ward.name,
          municipalityId: ward.municipalityId
        }));

        return res.status(200).json({
          success: true,
          data: formattedWards
        });
      }
    } catch (packageError) {
      console.log('Error using nepal-administrative-data package for wards:', packageError.message);
    }

    // Fallback: Find municipality and generate wards
    let municipality = null;
    let totalWards = 9;
    
    // Check cached municipalities
    for (const districtId in dataCache.municipalities) {
      municipality = dataCache.municipalities[districtId].find(m => m.id === municipalityIdNum);
      if (municipality) {
        totalWards = municipality.wards || municipality.totalWard || 9;
        break;
      }
    }
    
    // Check hardcoded municipalities
    if (!municipality && nepalLocations.municipalities) {
      for (const districtId in nepalLocations.municipalities) {
        municipality = nepalLocations.municipalities[districtId].find(m => m.id === municipalityIdNum);
        if (municipality) {
          totalWards = municipality.wards || 9;
          break;
        }
      }
    }

    if (municipality || totalWards) {
      const wards = [];
      for (let i = 1; i <= totalWards; i++) {
        wards.push({
          id: i,
          name: `Ward ${i}`,
          nameNp: `वडा ${i}`,
          municipalityId: municipalityIdNum
        });
      }
      
      // Cache the generated wards
      dataCache.wards[municipalityIdNum] = wards;

      const formattedWards = wards.map(ward => ({
        id: ward.id,
        name: lang === 'np' ? ward.nameNp : ward.name,
        nameNp: ward.nameNp,
        nameEn: ward.name,
        municipalityId: ward.municipalityId
      }));

      return res.status(200).json({
        success: true,
        data: formattedWards
      });
    }

    // If no data found
    return res.status(200).json({
      success: true,
      data: [],
      message: 'Ward data not available for this municipality. You can enter ward number in the street address field.'
    });
  } catch (error) {
    console.error('Error fetching wards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wards',
      error: error.message
    });
  }
};

// Get all location data (for frontend to cache)
export const getAllLocations = async (req, res) => {
  try {
    const { lang = 'en' } = req.query;

    const provinces = nepalLocations.provinces.map(province => ({
      id: province.id,
      name: lang === 'np' ? province.nameNp : province.name,
      nameNp: province.nameNp,
      nameEn: province.name,
      districts: nepalLocations.districts[province.id]?.map(district => ({
        id: district.id,
        name: lang === 'np' ? district.nameNp : district.name,
        nameNp: district.nameNp,
        nameEn: district.name
      })) || []
    }));

    res.status(200).json({
      success: true,
      data: provinces
    });
  } catch (error) {
    console.error('Error fetching all locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations',
      error: error.message
    });
  }
};

