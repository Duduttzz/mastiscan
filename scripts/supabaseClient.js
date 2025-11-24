import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { config } from "../config/config.js";

export const supabase = createClient(config.supabaseUrl, config.anonKey);
