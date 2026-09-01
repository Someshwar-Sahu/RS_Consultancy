export interface StateData {
  name: string;
  cities: string[];
}

export interface CountryData {
  code: string;
  name: string;
  dialCode: string;
  states: StateData[];
}

export const COUNTRIES_DATA: CountryData[] = [
  {
    code: "IN",
    name: "India",
    dialCode: "+91",
    states: [
      {
        name: "Delhi NCR",
        cities: ["Noida", "Greater Noida", "New Delhi", "Gurugram (Gurgaon)", "Faridabad", "Ghaziabad"],
      },
      {
        name: "Uttar Pradesh",
        cities: [
          "Lucknow",
          "Kanpur",
          "Jaunpur",
          "Varanasi",
          "Prayagraj (Allahabad)",
          "Agra",
          "Meerut",
          "Bareilly",
          "Aligarh",
          "Moradabad",
          "Gorakhpur",
          "Jhansi",
          "Ayodhya",
          "Mathura",
        ],
      },
      {
        name: "Maharashtra",
        cities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Navi Mumbai", "Aurangabad", "Solapur", "Kolhapur"],
      },
      {
        name: "Karnataka",
        cities: ["Bengaluru (Bangalore)", "Mysuru (Mysore)", "Hubballi-Dharwad", "Mangaluru", "Belagavi", "Davangere"],
      },
      {
        name: "Gujarat",
        cities: ["Ahmedabad", "Gandhinagar", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh"],
      },
      {
        name: "Tamil Nadu",
        cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur", "Erode", "Vellore"],
      },
      {
        name: "Telangana",
        cities: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam"],
      },
      {
        name: "Haryana",
        cities: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Rohtak", "Hisar", "Sonipat", "Panchkula"],
      },
      {
        name: "Rajasthan",
        cities: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bhilwara", "Alwar"],
      },
      {
        name: "West Bengal",
        cities: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Kharagpur"],
      },
      {
        name: "Madhya Pradesh",
        cities: ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas"],
      },
      {
        name: "Bihar",
        cities: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Bihar Sharif"],
      },
      {
        name: "Punjab",
        cities: ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali", "Bathinda"],
      },
      {
        name: "Kerala",
        cities: ["Kochi / Ernakulam", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam", "Kannur"],
      },
      {
        name: "Odisha",
        cities: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri"],
      },
      {
        name: "Andhra Pradesh",
        cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Kakinada"],
      },
      {
        name: "Uttarakhand",
        cities: ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh", "Kashipur"],
      },
      {
        name: "Jharkhand",
        cities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh"],
      },
      {
        name: "Assam",
        cities: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia"],
      },
      {
        name: "Goa",
        cities: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
      },
    ],
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    dialCode: "+971",
    states: [
      {
        name: "Dubai",
        cities: ["Dubai (Downtown)", "Dubai Marina", "Business Bay", "JLT", "Deira", "Bur Dubai", "Al Barsha"],
      },
      {
        name: "Abu Dhabi",
        cities: ["Abu Dhabi City", "Al Ain", "Al Dhafra", "Khalifa City", "Yas Island"],
      },
      {
        name: "Sharjah",
        cities: ["Sharjah City", "Khor Fakkan", "Kalba", "Al Dhaid"],
      },
      {
        name: "Ajman",
        cities: ["Ajman City", "Masfout", "Manama"],
      },
      {
        name: "Ras Al Khaimah",
        cities: ["RAK City", "Al Hamra", "Al Nakheel"],
      },
    ],
  },
  {
    code: "US",
    name: "United States",
    dialCode: "+1",
    states: [
      {
        name: "California",
        cities: ["San Francisco", "San Jose (Silicon Valley)", "Los Angeles", "San Diego", "Sacramento", "Oakland", "Palo Alto"],
      },
      {
        name: "New York",
        cities: ["New York City (Manhattan)", "Brooklyn", "Queens", "Buffalo", "Rochester", "Albany"],
      },
      {
        name: "Texas",
        cities: ["Austin", "Dallas", "Houston", "San Antonio", "Fort Worth", "Plano"],
      },
      {
        name: "Washington",
        cities: ["Seattle", "Bellevue", "Redmond", "Tacoma", "Spokane"],
      },
      {
        name: "Illinois",
        cities: ["Chicago", "Naperville", "Evanston", "Schaumburg"],
      },
      {
        name: "Massachusetts",
        cities: ["Boston", "Cambridge", "Worcester", "Quincy"],
      },
    ],
  },
  {
    code: "GB",
    name: "United Kingdom",
    dialCode: "+44",
    states: [
      {
        name: "England",
        cities: ["London", "Manchester", "Birmingham", "Leeds", "Bristol", "Cambridge", "Oxford", "Liverpool", "Newcastle"],
      },
      {
        name: "Scotland",
        cities: ["Edinburgh", "Glasgow", "Aberdeen", "Dundee"],
      },
      {
        name: "Wales",
        cities: ["Cardiff", "Swansea", "Newport"],
      },
    ],
  },
  {
    code: "CA",
    name: "Canada",
    dialCode: "+1",
    states: [
      {
        name: "Ontario",
        cities: ["Toronto", "Ottawa", "Mississauga", "Waterloo", "Brampton", "Markham", "Hamilton"],
      },
      {
        name: "British Columbia",
        cities: ["Vancouver", "Victoria", "Burnaby", "Richmond", "Surrey"],
      },
      {
        name: "Quebec",
        cities: ["Montreal", "Quebec City", "Laval", "Gatineau"],
      },
      {
        name: "Alberta",
        cities: ["Calgary", "Edmonton", "Red Deer"],
      },
    ],
  },
  {
    code: "SG",
    name: "Singapore",
    dialCode: "+65",
    states: [
      {
        name: "Singapore",
        cities: ["Central Area (CBD)", "Jurong East", "Changi", "Woodlands", "Tampines", "Ang Mo Kio"],
      },
    ],
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    dialCode: "+966",
    states: [
      {
        name: "Riyadh Province",
        cities: ["Riyadh City", "Al Kharj", "Ad Diriyah"],
      },
      {
        name: "Makkah Province",
        cities: ["Jeddah", "Makkah", "Taif", "Rabigh"],
      },
      {
        name: "Eastern Province",
        cities: ["Dammam", "Khobar", "Jubail", "Dhahran", "Al Ahsa"],
      },
    ],
  },
  {
    code: "QA",
    name: "Qatar",
    dialCode: "+974",
    states: [
      {
        name: "Doha Municipality",
        cities: ["Doha City", "West Bay", "Lusail", "The Pearl-Qatar"],
      },
      {
        name: "Al Rayyan Municipality",
        cities: ["Al Rayyan", "Education City", "Al Wajbah"],
      },
    ],
  },
  {
    code: "AU",
    name: "Australia",
    dialCode: "+61",
    states: [
      {
        name: "New South Wales",
        cities: ["Sydney", "Newcastle", "Wollongong", "Parramatta"],
      },
      {
        name: "Victoria",
        cities: ["Melbourne", "Geelong", "Ballarat", "Bendigo"],
      },
      {
        name: "Queensland",
        cities: ["Brisbane", "Gold Coast", "Sunshine Coast", "Townsville"],
      },
    ],
  },
  {
    code: "DE",
    name: "Germany",
    dialCode: "+49",
    states: [
      {
        name: "Bavaria",
        cities: ["Munich", "Nuremberg", "Augsburg", "Regensburg"],
      },
      {
        name: "Berlin",
        cities: ["Berlin (Mitte)", "Charlottenburg", "Kreuzberg"],
      },
      {
        name: "Hesse",
        cities: ["Frankfurt", "Wiesbaden", "Kassel", "Darmstadt"],
      },
      {
        name: "North Rhine-Westphalia",
        cities: ["Cologne", "Dusseldorf", "Dortmund", "Essen", "Bonn"],
      },
    ],
  },
];

export function getCountryByCode(code: string): CountryData {
  return COUNTRIES_DATA.find((c) => c.code === code) || COUNTRIES_DATA[0];
}

export function getCountryByDialCode(dialCode: string): CountryData {
  return COUNTRIES_DATA.find((c) => c.dialCode === dialCode) || COUNTRIES_DATA[0];
}
