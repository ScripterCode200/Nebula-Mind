export const PRICING = {
    // Gemini 1.5 Flash Pricing (Proxy for 2.5 Flash)
    // Input: $0.075 per 1M tokens
    // Output: $0.30 per 1M tokens
    // 1 USD = ~85 INR
    inputRatePerMillion: 0.075,
    outputRatePerMillion: 0.30,
    usdToInr: 85
};

export function calculateCost(inputTokens: number, outputTokens: number) {
    const inputCostUSD = (inputTokens / 1_000_000) * PRICING.inputRatePerMillion;
    const outputCostUSD = (outputTokens / 1_000_000) * PRICING.outputRatePerMillion;
    const totalCostUSD = inputCostUSD + outputCostUSD;

    const totalCostINR = totalCostUSD * PRICING.usdToInr;

    return {
        costUSD: totalCostUSD,
        costINR: totalCostINR,
        formattedINR: `₹${totalCostINR.toFixed(6)}` // High precision for small requests
    };
}

export function logTokenUsage(source: string, usageMetadata: any) {
    if (!usageMetadata) return;

    const inputTokens = usageMetadata.promptTokenCount || 0;
    const outputTokens = usageMetadata.candidatesTokenCount || 0;
    const totalTokens = usageMetadata.totalTokenCount || (inputTokens + outputTokens);

    const { formattedINR } = calculateCost(inputTokens, outputTokens);

    console.log(`\n[${source}] Token Usage Report:`);
    console.log(`----------------------------------------`);
    console.log(`Input Tokens:  ${inputTokens}`);
    console.log(`Output Tokens: ${outputTokens}`);
    console.log(`Total Tokens:  ${totalTokens}`);
    console.log(`Estimated Cost: ${formattedINR}`);
    console.log(`----------------------------------------\n`);
}
