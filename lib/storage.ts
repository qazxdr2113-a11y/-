import { Lead } from "@/types/Lead";

const KEY = "paylead-leads";

export function getLeads(): Lead[] {

    if (typeof window === "undefined") {

        return [];

    }

    const data = localStorage.getItem(KEY);

    if (!data) {

        return [];

    }

    return JSON.parse(data);

}

export function saveLead(lead: Lead) {

    const leads = getLeads();

    leads.unshift(lead);

    localStorage.setItem(

        KEY,

        JSON.stringify(leads)

    );

}