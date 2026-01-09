const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

// Exam Schema (Simplified)
const ExamSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    subject: { type: String },
    duration: { type: String },
    rarity: { type: String },
    questions: [{
        question: { type: String },
        type: { type: String },
        options: [{ type: String }],
        answer: { type: String },
        idealAnswer: { type: String },
        keyPoints: [{ type: String }]
    }],
    createdBy: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Exam = mongoose.models.Exam || mongoose.model('Exam', ExamSchema);

const examsToSeed = [
    {
        title: "IIT JEE Advanced: Physics Mastery",
        description: "A comprehensive test covering Rotational Mechanics, Electromagnetism, and Thermodynamics. Based on previous year JEE Advanced papers.",
        subject: "Physics",
        duration: "180 mins",
        rarity: "Legendary",
        createdBy: "admin_seed",
        questions: [
            {
                type: "LongAnswer",
                question: "Explain the concept of moment of inertia and derive the expression for the moment of inertia of a solid sphere about its diameter.",
                idealAnswer: "Moment of Inertia (I) is the rotational analog of mass. For a solid sphere of mass M and radius R, I = 2/5 MR².",
                keyPoints: ["Rotational inertia", "Integral calculus", "Parallel/Perpendicular axis theorem", "2/5 MR²"]
            },
            {
                type: "LongAnswer",
                question: "Describe the principle of a moving coil galvanometer. How can it be converted into an ammeter and a voltmeter?",
                idealAnswer: "Works on torque experienced by a current-carrying coil in a magnetic field. Ammeter: Shunt in parallel. Voltmeter: High resistance in series.",
                keyPoints: ["Torque = NIAB sin(theta)", "Radial magnetic field", "Shunt resistance", "Series resistance"]
            },
            {
                type: "LongAnswer",
                question: "Derive the lens maker's formula for a thin lens. State the sign convention used.",
                idealAnswer: "1/f = (n-1)(1/R1 - 1/R2). Sign convention: Light direction positive, optical center origin.",
                keyPoints: ["Refraction at spherical surfaces", "Thin lens approximation", "Sign convention", "Radii of curvature"]
            },
            {
                type: "LongAnswer",
                question: "Discuss the phenomenon of electromagnetic induction. State and explain Faraday's laws and Lenz's law.",
                idealAnswer: "EM induction is generating EMF by changing magnetic flux. Faraday: EMF = -d(phi)/dt. Lenz: Effect opposes cause.",
                keyPoints: ["Magnetic flux", "Rate of change", "Induced EMF", "Conservation of energy"]
            },
            {
                type: "LongAnswer",
                question: "Obtain an expression for the energy stored in a parallel plate capacitor. Where does this energy reside?",
                idealAnswer: "U = 1/2 CV² = 1/2 Q²/C. Energy resides in the electric field between the plates.",
                keyPoints: ["Work done in charging", "Electric field energy density", "1/2 epsilon E²"]
            },
            {
                type: "LongAnswer",
                question: "Derive an expression for the electric potential due to an electric dipole at an arbitrary point.",
                idealAnswer: "V = (1/4pi epsilon) * p cos(theta) / r². Depends on angle and distance.",
                keyPoints: ["Superposition principle", "Dipole moment", "Approximation r >> a"]
            },
            {
                type: "LongAnswer",
                question: "State Biot-Savart law. Use it to find the magnetic field on the axis of a circular current loop.",
                idealAnswer: "dB = (mu0 I dl x r) / 4pi r³. For loop axis: B = mu0 I R² / 2(R²+x²)^(3/2).",
                keyPoints: ["Current element", "Cross product", "Axial symmetry", "Integration"]
            },
            {
                type: "LongAnswer",
                question: "Explain the working of a Carnot engine and derive the expression for its efficiency.",
                idealAnswer: "Ideal reversible engine. Efficiency = 1 - T2/T1. Depends only on source and sink temperatures.",
                keyPoints: ["Isothermal/Adiabatic processes", "PV diagram", "Second law of thermodynamics"]
            },
            {
                type: "LongAnswer",
                question: "Derive the expression for the fringe width in Young's double-slit experiment.",
                idealAnswer: "Beta = lambda D / d. Depends on wavelength, screen distance, and slit separation.",
                keyPoints: ["Path difference", "Constructive/Destructive interference", "Small angle approximation"]
            },
            {
                type: "LongAnswer",
                question: "What is the photoelectric effect? Establish Einstein's photoelectric equation.",
                idealAnswer: "Emission of electrons by light. K_max = h nu - Phi. Particle nature of light.",
                keyPoints: ["Photon energy", "Work function", "Threshold frequency", "Stopping potential"]
            },
            {
                type: "LongAnswer",
                question: "Derive the expression for the time period of a simple pendulum. Discuss the effect of length and gravity.",
                idealAnswer: "T = 2pi sqrt(L/g). Independent of mass. Directly proportional to sqrt(L).",
                keyPoints: ["Restoring torque", "Small oscillation", "SHM condition"]
            },
            {
                type: "LongAnswer",
                question: "Explain Kirchhoff's laws of electrical networks. Apply them to a Wheatstone bridge.",
                idealAnswer: "KCL (Charge conservation), KVL (Energy conservation). Bridge balance condition R1/R2 = R3/R4.",
                keyPoints: ["Junction rule", "Loop rule", "Null deflection", "Balanced bridge"]
            },
            {
                type: "LongAnswer",
                question: "Discuss the formation of stationary waves in a stretched string. Find the frequencies of harmonics.",
                idealAnswer: "Superposition of incident and reflected waves. fn = n v / 2L.",
                keyPoints: ["Nodes and Antinodes", "Boundary conditions", "Fundamental frequency", "Overtones"]
            },
            {
                type: "LongAnswer",
                question: "Derive the relation between Cp and Cv for an ideal gas. (Mayer's Formula)",
                idealAnswer: "Cp - Cv = R. Based on First Law of Thermodynamics and Ideal Gas Equation.",
                keyPoints: ["Internal energy", "Work done", "Isobaric/Isochoric processes"]
            },
            {
                type: "LongAnswer",
                question: "Explain the phenomenon of total internal reflection. What are the conditions for it to take place?",
                idealAnswer: "Light traveling from denser to rarer medium reflects back if angle > critical angle.",
                keyPoints: ["Critical angle", "Optical fiber", "Mirage", "Snell's law violation"]
            }
        ]
    },
    {
        title: "NEET UG: Biology & Human Physiology",
        description: "Intense test on Human Physiology, Genetics, and Cell Biology.",
        subject: "Biology",
        duration: "180 mins",
        rarity: "Legendary",
        createdBy: "admin_seed",
        questions: [
            {
                type: "LongAnswer",
                question: "Describe the mechanism of urine formation in the human kidney.",
                idealAnswer: "Glomerular filtration, Tubular reabsorption, Tubular secretion in the nephron.",
                keyPoints: ["Bowman's capsule", "Loop of Henle", "Counter-current mechanism"]
            },
            {
                type: "LongAnswer",
                question: "Explain the double circulation of blood in humans with a schematic diagram description.",
                idealAnswer: "Pulmonary (Heart-Lungs) and Systemic (Heart-Body) circulation. Prevents mixing of oxygenated/deoxygenated blood.",
                keyPoints: ["Right/Left Ventricles", "Aorta", "Pulmonary artery", "Capillary exchange"]
            },
            {
                type: "LongAnswer",
                question: "Describe the process of DNA replication. Why is it called semi-conservative?",
                idealAnswer: "Unwinding, Primer binding, Elongation (DNA Polymerase), Termination. One strand is old, one is new.",
                keyPoints: ["Helicase", "Leading/Lagging strand", "Okazaki fragments", "Meselson-Stahl experiment"]
            },
            {
                type: "LongAnswer",
                question: "Explain the mechanism of muscle contraction according to the sliding filament theory.",
                idealAnswer: "Actin filaments slide over Myosin filaments powered by ATP hydrolysis.",
                keyPoints: ["Sarcomere", "Cross-bridge formation", "Calcium ions", "Troponin/Tropomyosin"]
            },
            {
                type: "LongAnswer",
                question: "Discuss the hormonal control of the menstrual cycle in human females.",
                idealAnswer: "FSH/LH (Pituitary), Estrogen/Progesterone (Ovary). Follicular, Ovulatory, Luteal phases.",
                keyPoints: ["Feedback mechanism", "Endometrium thickening", "Corpus luteum", "Menstruation"]
            },
            {
                type: "LongAnswer",
                question: "Describe the structure and function of the human diagrammatic heart.",
                idealAnswer: "Four chambers, valves (Tricuspid, Bicuspid), SA node (Pacemaker). Pumps blood.",
                keyPoints: ["Atria/Ventricles", "Cardiac cycle", "Systole/Diastole", "Double circulation"]
            },
            {
                type: "LongAnswer",
                question: "Explain the process of photosynthesis C3 cycle (Calvin Cycle).",
                idealAnswer: "Carboxylation, Reduction, Regeneration. Occurs in stroma. Produces glucose.",
                keyPoints: ["Rubisco", "RuBP", "ATP/NADPH consumption", "Carbon fixation"]
            },
            {
                type: "LongAnswer",
                question: "Describe the transmission of a nerve impulse across a chemical synapse.",
                idealAnswer: "Action potential reaches axon terminal -> Ca2+ influx -> Neurotransmitter release -> Receptor binding -> Depolarization.",
                keyPoints: ["Synaptic cleft", "Vesicles", "Acetylcholine", "Post-synaptic membrane"]
            },
            {
                type: "LongAnswer",
                question: "Explain Mendel's Law of Independent Assortment with a dihybrid cross example.",
                idealAnswer: "Alleles of different genes segregate independently. 9:3:3:1 ratio in F2 generation.",
                keyPoints: ["Round Yellow x Wrinkled Green", "Gamete formation", "Punnett square"]
            },
            {
                type: "LongAnswer",
                question: "Describe the various steps of Glycolysis. Where does it occur?",
                idealAnswer: "Glucose to Pyruvate breakdown. Occurs in cytoplasm. Net gain: 2 ATP, 2 NADH.",
                keyPoints: ["Investment phase", "Payoff phase", "Substrate-level phosphorylation", "Anaerobic"]
            },
            {
                type: "LongAnswer",
                question: "What is immunity? Distinguish between active and passive immunity.",
                idealAnswer: "Resistance to disease. Active: Body makes antibodies (Vaccine/Infection). Passive: Ready-made antibodies (Mother's milk/Serum).",
                keyPoints: ["Antigen-Antibody", "Memory cells", "T-cells/B-cells"]
            },
            {
                type: "LongAnswer",
                question: "Explain the mechanism of breathing in humans (Inspiration and Expiration).",
                idealAnswer: "Inspiration: Diaphragm contracts (flat), chest expands, pressure drops. Expiration: Diaphragm relaxes (dome), chest contracts.",
                keyPoints: ["Intercostal muscles", "Thoracic volume", "Intra-pulmonary pressure"]
            },
            {
                type: "LongAnswer",
                question: "Describe the structure of DNA (Double Helix Model) proposed by Watson and Crick.",
                idealAnswer: "Double helix, antiparallel strands, A-T (2 H-bonds), G-C (3 H-bonds), sugar-phosphate backbone.",
                keyPoints: ["Nucleotides", "Base pairing", "Major/Minor groove", "Chargaff's rule"]
            },
            {
                type: "LongAnswer",
                question: "Explain the process of digestion and absorption of proteins in the human gut.",
                idealAnswer: "Stomach (Pepsin) -> Small Intestine (Trypsin, Chymotrypsin). Absorbed as amino acids via active transport.",
                keyPoints: ["Proteases", "Hydrolysis", "Villi/Microvilli"]
            },
            {
                type: "LongAnswer",
                question: "Describe the lac operon concept in E. coli.",
                idealAnswer: "Gene regulation. Inducible system. Lactose acts as inducer binding to repressor, allowing transcription.",
                keyPoints: ["Promoter", "Operator", "Structural genes (z, y, a)", "Repressor protein"]
            }
        ]
    },
    {
        title: "JEEMAIN: Calculus & Algebra",
        description: "Hard-core Mathematics covering Integration, Derivatives, Matrices, and Probability.",
        subject: "Mathematics",
        duration: "180 mins",
        rarity: "Legendary",
        createdBy: "admin_seed",
        questions: [
            {
                type: "LongAnswer",
                question: "Evaluate the definite integral of ln(x) from 1 to e.",
                idealAnswer: "[x ln(x) - x] from 1 to e = (e - e) - (0 - 1) = 1.",
                keyPoints: ["Integration by parts", "Limits substitution", "Logarithmic properties"]
            },
            {
                type: "LongAnswer",
                question: "Find the area bounded by the curve y² = 4ax and its latus rectum.",
                idealAnswer: "Area = 8a²/3. Double the area in the first quadrant.",
                keyPoints: ["Parabola focus", "Integration y dx", "Limits 0 to a"]
            },
            {
                type: "LongAnswer",
                question: "Solve the differential equation dy/dx + y cot(x) = 2x + x² cot(x).",
                idealAnswer: "Linear differential equation. Integrating factor IF = sin(x). Solution y sin(x) = x² sin(x) + C.",
                keyPoints: ["Integrating factor", "Linear form", "General solution"]
            },
            {
                type: "LongAnswer",
                question: "Find the inverse of the matrix A = [[1, 2], [3, 4]].",
                idealAnswer: "Det(A) = -2. Adj(A) = [[4, -2], [-3, 1]]. Inverse = -1/2 [[4, -2], [-3, 1]].",
                keyPoints: ["Determinant", "Adjoint", "A inverse formula"]
            },
            {
                type: "LongAnswer",
                question: "Discuss the continuity and differentiability of f(x) = |x| at x = 0.",
                idealAnswer: "Continuous at x=0 (LHL=RHL=f(0)). Not differentiable (LHD = -1, RHD = 1).",
                keyPoints: ["Sharp turn", "Limit existence", "Left/Right derivative"]
            },
            {
                type: "LongAnswer",
                question: "Find the maximum and minimum values of f(x) = 3x^4 - 8x^3 + 12x^2 - 48x + 25 on [0, 3].",
                idealAnswer: "Find f'(x)=0. Critical points. Evaluate f(x) at critical points and endpoints.",
                keyPoints: ["First derivative test", "Absolute maxima/minima", "Interval checking"]
            },
            {
                type: "LongAnswer",
                question: "In a binomial distribution B(n, p), if mean is 4 and variance is 2, find the probability of exactly 2 successes.",
                idealAnswer: "np=4, npq=2 => q=0.5, p=0.5, n=8. P(X=2) = 8C2 (0.5)^8.",
                keyPoints: ["Binomial parameters", "Relation mean/variance", "Probability mass function"]
            },
            {
                type: "LongAnswer",
                question: "Find the equation of the plane passing through (1, 1, -1), (6, 4, -5), and (-4, -2, 3).",
                idealAnswer: "Use determinant form with (x-x1, y-y1, z-z1) and direction vectors.",
                keyPoints: ["Normal vector", "Cross product", "Plane equation ax+by+cz=d"]
            },
            {
                type: "LongAnswer",
                question: "Find the sum of the infinite series 1 + 1/3 + 1/6 + 1/10 + 1/15 + ...",
                idealAnswer: "Sum of reciprocals of triangular numbers. 2 * Sum(1/n(n+1)). Telescoping series. Sum = 2.",
                keyPoints: ["Triangular numbers", "Partial fractions", "Telescoping sum", "Limit n->infinity"]
            },
            {
                type: "LongAnswer",
                question: "If w is a complex cube root of unity, find the value of (1 + w - w²)^7.",
                idealAnswer: "(1+w = -w²). (-2w²)^7 = -128 w^14 = -128 w².",
                keyPoints: ["1+w+w²=0", "w^3=1", "De Moivre's theorem"]
            },
            {
                type: "LongAnswer",
                question: "Find the shortest distance between the lines r = i+j + lambda(2i-j+k) and r = 2i+j-k + mu(3i-5j+2k).",
                idealAnswer: "SD = |(a2-a1) dot (b1 x b2)| / |b1 x b2|. Skew lines.",
                keyPoints: ["Vector difference", "Cross product of directions", "Projection"]
            },
            {
                type: "LongAnswer",
                question: "Find the number of ways to arrange the letters of the word 'MISSISSIPPI'.",
                idealAnswer: "11! / (4! 4! 2!). 11 letters, 4 S, 4 I, 2 P.",
                keyPoints: ["Permutation with repetition", "Factorial division"]
            },
            {
                type: "LongAnswer",
                question: "Determine the radius and center of the circle x² + y² - 4x + 6y - 12 = 0.",
                idealAnswer: "g=-2, f=3, c=-12. Center (2, -3). Radius = sqrt(4 + 9 + 12) = 5.",
                keyPoints: ["General circle equation", "Completing the square"]
            },
            {
                type: "LongAnswer",
                question: "If y = tan^(-1)( (sqrt(1+x²) - 1)/x ), find dy/dx.",
                idealAnswer: "Substitute x = tan(theta). y = theta/2. dy/dx = 1 / (2(1+x²)).",
                keyPoints: ["Trigonometric substitution", "Inverse trigonometric simplification", "Chain rule"]
            },
            {
                type: "LongAnswer",
                question: "Solve the system of linear equations using Cramer's rule: x+y+z=6, x-y+z=2, 2x+y-z=1.",
                idealAnswer: "Calculate Determinant D, Dx, Dy, Dz. x=Dx/D, y=Dy/D, z=Dz/D.",
                keyPoints: ["Determinant calculation", "Consistency check", "Unique solution"]
            }
        ]
    }
];

async function seedExams() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const exam of examsToSeed) {
            const existing = await Exam.findOne({ title: exam.title });
            if (!existing) {
                await Exam.create(exam);
                console.log(`✅ Created Exam: ${exam.title}`);
            } else {
                console.log(`⚠️ Skipped (Already exists): ${exam.title}`);
            }
        }

        console.log('Seeding complete.');
    } catch (error) {
        console.error('Seeding error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedExams();
