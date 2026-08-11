export interface DashboardHomeResponse {
logo: string;
banner: string;
nameCompany: string;
addressCompany: string;
emailCompany: string;
CompanyCertificate: boolean;
memberAT: string;
role: string;
sales: number;
stars: number;
reviews: number;
}

export interface CompanyProfileResponse {
nameCompany: string;
emailCompany: string;
addressCompany: string;
tellCompany: string;
memberAT: string;
averageRating: number;
totalReviews: number;
completeSales: number;
sellerLevel: string;
logo?: string;
banner?: string;
}

export interface CatalogResponse {
id: string;
name: string;
}

export interface SpecificationResponse {
id: string;
name: string;
type: string;
required: boolean;
}

export interface MyProductResponse {
id: string;
name: string;
description: string;
category: string;
price: number;
stock: number;
image: string | null;
is_active: boolean;
}

export interface MyProductsPaginationResponse {
page: number;
limit: number;
total: number;
total_pages: number;
products: MyProductResponse[];
}
