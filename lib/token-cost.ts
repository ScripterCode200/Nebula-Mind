// 1 USD = ~86 INR (Updated)
const USD_TO_INR = 86;

type PricingTier = {
    input: number; // USD per 1M tokens
    output: number; // USD per 1M tokens
    name: string;
};

const PRICING: Record<string, PricingTier> = {
    'gemini-2.5-flash': { input: 0.075, output: 0.30, name: 'Gemini 2.5 Flash' },
    'gemini-3-pro': { input: 1.25, output: 5.00, name: 'Gemini 3 Pro' },
    'gemini-3-flash': { input: 0.075, output: 0.30, name: 'Gemini 3 Flash' },
    'default': { input: 0, output: 0, name: 'Unknown Model' }
};

function getPricing(model: string): PricingTier {
    // Normalize model string
    const lower = model.toLowerCase();

    if (lower.includes('3') && lower.includes('pro')) return PRICING['gemini-3-pro'];
    if (lower.includes('3') && lower.includes('flash')) return PRICING['gemini-3-flash'];
    if (lower.includes('2.5') && lower.includes('flash')) return PRICING['gemini-2.5-flash'];

    // Return 0 cost for any other model as requested ("We don't want any other Model cost estimate")
    return PRICING['default'];
}

export function calculateCost(model: string, inputTokens: number, outputTokens: number) {
    const tier = getPricing(model);
    const inputCostUSD = (inputTokens / 1_000_000) * tier.input;
    const outputCostUSD = (outputTokens / 1_000_000) * tier.output;
    const totalCostUSD = inputCostUSD + outputCostUSD;

    const totalCostINR = totalCostUSD * USD_TO_INR;

    return {
        modelName: tier.name,
        costUSD: totalCostUSD,
        costINR: totalCostINR,
        formattedINR: `₹${totalCostINR.toFixed(6)}`
    };
}

export function logTokenUsage(source: string, model: string, usageMetadata: any) {
    if (!usageMetadata) return;

    const inputTokens = usageMetadata.promptTokenCount || usageMetadata.input_tokens || 0;
    const outputTokens = usageMetadata.candidatesTokenCount || usageMetadata.output_tokens || 0;
    const totalTokens = usageMetadata.totalTokenCount || (inputTokens + outputTokens);

    const { formattedINR, modelName } = calculateCost(model, inputTokens, outputTokens);

    console.log(`\n[${source}] Token Usage Report (${modelName}):`);
    console.log(`----------------------------------------`);
    console.log(`Input Tokens:  ${inputTokens}`);
    console.log(`Output Tokens: ${outputTokens}`);
    console.log(`Total Tokens:  ${totalTokens}`);
    console.log(`Estimated Cost: ${formattedINR}`);
    console.log(`----------------------------------------\n`);
}
