
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            products: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    description: string | null
                    price: number
                    image_url: string | null
                    category_id: string | null
                    active: boolean
                    slug: string
                    stock: number
                    highlight: boolean
                }
                Insert: {
                    id?: string
                    created_at?: string
                    name: string
                    description?: string | null
                    price: number
                    image_url?: string | null
                    category_id?: string | null
                    active?: boolean
                    slug: string
                    stock?: number
                    highlight?: boolean
                }
                Update: {
                    id?: string
                    created_at?: string
                    name?: string
                    description?: string | null
                    price?: number
                    image_url?: string | null
                    category_id?: string | null
                    active?: boolean
                    slug?: string
                    stock?: number
                    highlight?: boolean
                }
                Relationships: []
            },
            categories: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    slug: string
                    description: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    name: string
                    slug: string
                    description?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    name?: string
                    slug?: string
                    description?: string | null
                }
                Relationships: []
            },
            orders: {
                Row: {
                    id: string
                    created_at: string
                    user_id: string
                    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
                    total_amount: number
                    payment_method: string
                    tracking_code: string | null
                    shipping_address: Json
                    items: Json
                }
                Insert: {
                    id?: string
                    created_at?: string
                    user_id: string
                    status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
                    total_amount: number
                    payment_method: string
                    tracking_code?: string | null
                    shipping_address: Json
                    items: Json
                }
                Update: {
                    id?: string
                    created_at?: string
                    user_id?: string
                    status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
                    total_amount?: number
                    payment_method?: string
                    tracking_code?: string | null
                    shipping_address?: Json
                    items?: Json
                }
                Relationships: []
            },
            size_charts: {
                Row: {
                    id: string
                    created_at: string
                    updated_at: string
                    product_id: string
                    size: 'PP' | 'P' | 'M' | 'G' | 'GG'
                    bust_min: number | null
                    bust_max: number | null
                    underbust_min: number | null
                    underbust_max: number | null
                    waist_min: number | null
                    waist_max: number | null
                    hip_min: number | null
                    hip_max: number | null
                    bra_number: string | null
                    source: 'manual' | 'fornecedor' | 'erp'
                }
                Insert: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    product_id: string
                    size: 'PP' | 'P' | 'M' | 'G' | 'GG'
                    bust_min?: number | null
                    bust_max?: number | null
                    underbust_min?: number | null
                    underbust_max?: number | null
                    waist_min?: number | null
                    waist_max?: number | null
                    hip_min?: number | null
                    hip_max?: number | null
                    bra_number?: string | null
                    source?: 'manual' | 'fornecedor' | 'erp'
                }
                Update: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    product_id?: string
                    size?: 'PP' | 'P' | 'M' | 'G' | 'GG'
                    bust_min?: number | null
                    bust_max?: number | null
                    underbust_min?: number | null
                    underbust_max?: number | null
                    waist_min?: number | null
                    waist_max?: number | null
                    hip_min?: number | null
                    hip_max?: number | null
                    bra_number?: string | null
                    source?: 'manual' | 'fornecedor' | 'erp'
                }
                Relationships: []
            },
            financial_configs: {
                Row: {
                    id: string
                    created_at: string
                    rule_key: string
                    rule_value: number
                    description: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    rule_key: string
                    rule_value: number
                    description?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    rule_key?: string
                    rule_value?: number
                    description?: string | null
                }
                Relationships: []
            },
            profiles: {
                Row: {
                    id: string
                    created_at: string
                    full_name: string | null
                    avatar_url: string | null
                    phone: string | null
                    cpf: string | null
                    birth_date: string | null
                }
                Insert: {
                    id: string
                    created_at?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    phone?: string | null
                    cpf?: string | null
                    birth_date?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    phone?: string | null
                    cpf?: string | null
                    birth_date?: string | null
                }
                Relationships: []
            },
            addresses: {
                Row: {
                    id: string
                    created_at: string
                    user_id: string
                    recipient: string
                    zip_code: string
                    state: string
                    city: string
                    neighborhood: string
                    street: string
                    number: string
                    complement: string | null
                    is_default: boolean
                }
                Insert: {
                    id?: string
                    created_at?: string
                    user_id: string
                    recipient: string
                    zip_code: string
                    state: string
                    city: string
                    neighborhood: string
                    street: string
                    number: string
                    complement?: string | null
                    is_default?: boolean
                }
                Update: {
                    id?: string
                    created_at?: string
                    user_id?: string
                    recipient?: string
                    zip_code?: string
                    state?: string
                    city?: string
                    neighborhood?: string
                    street?: string
                    number?: string
                    complement?: string | null
                    is_default?: boolean
                }
                Relationships: []
            },
            favorites: {
                Row: {
                    id: string
                    created_at: string
                    user_id: string
                    product_id: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    user_id: string
                    product_id: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    user_id?: string
                    product_id?: string
                }
                Relationships: []
            },
            reviews: {
                Row: {
                    id: string
                    created_at: string
                    user_id: string
                    order_id: string | null
                    product_id: string | null
                    product_name: string | null
                    rating: number
                    comment: string | null
                    approved: boolean
                }
                Insert: {
                    id?: string
                    created_at?: string
                    user_id: string
                    order_id?: string | null
                    product_id?: string | null
                    product_name?: string | null
                    rating: number
                    comment?: string | null
                    approved?: boolean
                }
                Update: {
                    id?: string
                    created_at?: string
                    user_id?: string
                    order_id?: string | null
                    product_id?: string | null
                    product_name?: string | null
                    rating?: number
                    comment?: string | null
                    approved?: boolean
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
