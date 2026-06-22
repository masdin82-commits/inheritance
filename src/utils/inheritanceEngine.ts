/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface InheritanceInputs {
  deceasedName: string;
  gender: 'male' | 'female';
  estateValue: number;
  debts: number;
  funeralExpenses: number;
  bequests: number;
  
  // Heir Counts/Presence
  spouseCount: number; // 0 or 1 for Male deceased (Husband), 0 to 4 for Female deceased (Wives)
  sonsCount: number;
  daughtersCount: number;
  grandsonsCount: number; // Son's son
  granddaughtersCount: number; // Son's daughter
  hasFather: boolean;
  hasMother: boolean;
  hasPaternalGrandfather: boolean;
  hasPaternalGrandmother: boolean;
  hasMaternalGrandmother: boolean;
  fullBrothersCount: number;
  fullSistersCount: number;
  paternalBrothersCount: number; // Consanguine Brothers
  paternalSistersCount: number; // Consanguine Sisters
  maternalSiblingsCount: number; // Uterine Brothers/Sisters (combined)
}

export interface HeirResult {
  relationship: string;
  arabicName: string;
  count: number;
  isExcluded: boolean;
  exclusionReason?: string;
  baseShare: string; // e.g. "1/6", "Residue (Asabah)", "0"
  percentage: number;
  amount: number;
  type: 'sharer' | 'residuary' | 'excluded' | 'none';
}

export interface CalculationResult {
  inputs: InheritanceInputs;
  netEstate: number;
  debtsDeducted: number;
  funeralDeducted: number;
  bequestsDeducted: number;
  bequestCapped: boolean;
  totalDistributed: number;
  rawSihamSum: number; // out of 24
  adjustmentType: 'normal' | 'aoul' | 'radd';
  heirs: HeirResult[];
  steps: string[];
}

/**
 * Islamic Inheritance (Faraid) mathematical processing engine
 */
export function calculateInheritance(inputs: InheritanceInputs): CalculationResult {
  const steps: string[] = [];
  
  // 1. Deduct primary dues
  const initialValue = inputs.estateValue;
  const debts = Math.min(initialValue, inputs.debts);
  const remainingAfterDebts = initialValue - debts;
  
  const funeral = Math.min(remainingAfterDebts, inputs.funeralExpenses);
  const remainingAfterFuneral = remainingAfterDebts - funeral;
  
  // Bequests (Wasiyyah) - capped at 1/3 of the estate after debts & funeral expenses
  const maxBequestAllowed = remainingAfterFuneral / 3;
  let bequestCapped = false;
  let bequest = inputs.bequests;
  if (bequest > maxBequestAllowed) {
    bequest = maxBequestAllowed;
    bequestCapped = true;
  }
  
  const netEstate = remainingAfterFuneral - bequest;
  
  steps.push(`Total Estate: ${initialValue.toLocaleString()}`);
  if (debts > 0) steps.push(`Deducted Outstanding Debts: -${debts.toLocaleString()}`);
  if (funeral > 0) steps.push(`Deducted Funeral & Burial Expenses: -${funeral.toLocaleString()}`);
  if (bequest > 0) {
    steps.push(`Deducted Bequests/Wills: -${bequest.toLocaleString()}${bequestCapped ? " (Capped at the Sharia limit of 1/3 of net asset)" : ""}`);
  }
  steps.push(`Net Estate for Distribution (Tarikah): ${netEstate.toLocaleString()}`);

  const heirs: HeirResult[] = [];
  
  // Helper to add heir or track exclusion
  const handleExclusion = (relationship: string, arabicName: string, count: number, reason: string): HeirResult => {
    return {
      relationship,
      arabicName,
      count,
      isExcluded: true,
      exclusionReason: reason,
      baseShare: "0",
      percentage: 0,
      amount: 0,
      type: 'excluded'
    };
  };

  // 2. Compute existence flags
  const hasSons = inputs.sonsCount > 0;
  const hasDaughters = inputs.daughtersCount > 0;
  const hasChildren = hasSons || hasDaughters;
  
  const hasGrandsons = inputs.grandsonsCount > 0;
  const hasGranddaughters = inputs.granddaughtersCount > 0;
  const hasDescendants = hasChildren || hasGrandsons || hasGranddaughters;
  
  const hasMaleDescendants = hasSons || hasGrandsons;
  const hasDescendantLine = hasChildren || hasGrandsons || hasGranddaughters;

  // Sibling counts
  const totalSiblingsCount = 
    inputs.fullBrothersCount + 
    inputs.fullSistersCount + 
    inputs.paternalBrothersCount + 
    inputs.paternalSistersCount + 
    inputs.maternalSiblingsCount;

  // 3. Exclusion Logic (Hajb)
  const exclusions: Record<string, string | null> = {
    husband: null,
    wife: null,
    father: null,
    mother: null,
    sons: null,
    daughters: null,
    paternalGrandfather: null,
    paternalGrandmother: null,
    maternalGrandmother: null,
    grandsons: null,
    granddaughters: null,
    fullBrothers: null,
    fullSisters: null,
    paternalBrothers: null,
    paternalSisters: null,
    maternalSiblings: null,
  };

  // Spouse exclusions based on gender of deceased
  if (inputs.gender === 'male') {
    exclusions.husband = "Deceased is male (only wives can inherit)";
  } else {
    exclusions.wife = "Deceased is female (only husband can inherit)";
  }

  // Descendants
  if (hasSons) {
    exclusions.grandsons = "Excluded by living Son";
    exclusions.granddaughters = "Excluded by living Son";
  }

  // Ascendants
  if (inputs.hasFather) {
    exclusions.paternalGrandfather = "Excluded by living Father";
    exclusions.paternalGrandmother = "Excluded by living Father"; // Traditionally, Father link is excluded
  }
  if (inputs.hasMother) {
    exclusions.paternalGrandmother = "Excluded by living Mother";
    exclusions.maternalGrandmother = "Excluded by living Mother";
  }

  // Siblings exclusion rules
  // Excluded by living Father
  if (inputs.hasFather) {
    exclusions.fullBrothers = "Excluded by living Father";
    exclusions.fullSisters = "Excluded by living Father";
    exclusions.paternalBrothers = "Excluded by living Father";
    exclusions.paternalSisters = "Excluded by living Father";
    exclusions.maternalSiblings = "Excluded by living Father";
  }
  // Excluded by living Paternal Grandfather
  else if (inputs.hasPaternalGrandfather) {
    exclusions.fullBrothers = "Excluded by living Grandfather (Sunni classical rule)";
    exclusions.fullSisters = "Excluded by living Grandfather (Sunni classical rule)";
    exclusions.paternalBrothers = "Excluded by living Grandfather";
    exclusions.paternalSisters = "Excluded by living Grandfather";
    exclusions.maternalSiblings = "Excluded by living Grandfather";
  }

  // Excluded by male descendants
  if (hasMaleDescendants) {
    exclusions.fullBrothers = `Excluded by living ${hasSons ? "Son" : "Grandson"}`;
    exclusions.fullSisters = `Excluded by living ${hasSons ? "Son" : "Grandson"}`;
    exclusions.paternalBrothers = `Excluded by living ${hasSons ? "Son" : "Grandson"}`;
    exclusions.paternalSisters = `Excluded by living ${hasSons ? "Son" : "Grandson"}`;
    exclusions.maternalSiblings = `Excluded by living ${hasSons ? "Son" : "Grandson"}`;
  }

  // Uterine Siblings (Maternal) also excluded by female descendants
  if (hasDaughters || hasGranddaughters) {
    exclusions.maternalSiblings = `Excluded by living ${hasDaughters ? "Daughter" : "Granddaughter"}`;
  }

  // Full Brother / Sister exclusions over Paternal Sibling line
  const hasFullBrothers = inputs.fullBrothersCount > 0 && !exclusions.fullBrothers;
  const hasFullSisters = inputs.fullSistersCount > 0 && !exclusions.fullSisters;

  if (hasFullBrothers) {
    exclusions.paternalBrothers = "Excluded by living Full Brother";
    exclusions.paternalSisters = "Excluded by living Full Brother";
  }

  // Paternal Sisters excluded if there are MCQ (Asabah ma'al Ghair Full Sisters) or multiple Full Sisters (2+), unless there's a Paternal Brother
  if (inputs.fullSistersCount >= 2 && !exclusions.fullSisters && inputs.paternalBrothersCount === 0) {
    exclusions.paternalSisters = "Excluded by multiple living Full Sisters (2+) with no Paternal Brother to restore residue";
  }

  // Granddaughters excluded if 2+ Daughters are alive and no Grandson is present
  if (inputs.daughtersCount >= 2 && !exclusions.daughters && inputs.grandsonsCount === 0) {
    exclusions.granddaughters = "Excluded by multiple living Daughters (2+) with no Grandson to restore residue";
  }

  // 4. Quranic Shares (Siham) out of 24
  const siham: Record<string, number> = {
    husband: 0,
    wife: 0,
    father: 0,
    mother: 0,
    daughter: 0,
    granddaughter: 0,
    paternalGrandfather: 0,
    paternalGrandmother: 0,
    maternalGrandmother: 0,
    maternalSiblings: 0,
    fullSister: 0,
    paternalSister: 0,
  };

  // Spouse
  if (inputs.gender === 'female' && inputs.spouseCount > 0 && !exclusions.husband) {
    siham.husband = hasDescendantLine ? 6 : 12; // 1/4 or 1/2
    steps.push(`Husband gets ${hasDescendantLine ? "1/4" : "1/2"} share because deceased ${hasDescendantLine ? "had" : "had no"} descendants.`);
  } else if (inputs.gender === 'male' && inputs.spouseCount > 0 && !exclusions.wife) {
    siham.wife = hasDescendantLine ? 3 : 6; // 1/8 or 1/4 (shared by all wives)
    steps.push(`${inputs.spouseCount} Wife/Wives share ${hasDescendantLine ? "1/8" : "1/4"} because deceased ${hasDescendantLine ? "had" : "had no"} descendants.`);
  }

  // Mother
  if (inputs.hasMother && !exclusions.mother) {
    const hasMultipleSiblings = totalSiblingsCount >= 2;
    // Check Umariyyatayn (Gharrawayn)
    const isUmariyyataynHusband = !hasDescendantLine && inputs.hasFather && inputs.gender === 'female' && inputs.spouseCount > 0;
    const isUmariyyataynWife = !hasDescendantLine && inputs.hasFather && inputs.gender === 'male' && inputs.spouseCount > 0;
    
    if (isUmariyyataynHusband) {
      // Mother gets 1/3 of Remainder = 1/3 of (1 - 1/2) = 1/6 of total => 4 siham
      siham.mother = 4;
      steps.push("Mother gets 1/3 of Remainder (1/6 of total) under the Umariyyatayn rule (Husband, Father, Mother case).");
    } else if (isUmariyyataynWife) {
      // Mother gets 1/3 of Remainder = 1/3 of (1 - 1/4) = 1/4 of total => 6 siham
      siham.mother = 6;
      steps.push("Mother gets 1/3 of Remainder (1/4 of total) under the Umariyyatayn rule (Wife, Father, Mother case).");
    } else {
      siham.mother = (hasDescendantLine || hasMultipleSiblings) ? 4 : 8; // 1/6 or 1/3
      steps.push(`Mother gets ${siham.mother === 4 ? "1/6" : "1/3"} share because deceased ${hasDescendantLine ? "had children" : "had no children"} and has ${hasMultipleSiblings ? "multiple siblings (2+)" : "fewer than 2 siblings"}.`);
    }
  }

  // Father
  let fatherIsResiduary = false;
  if (inputs.hasFather && !exclusions.father) {
    if (hasSons || hasGrandsons) {
      // If there are male descendants, Father gets exact 1/6
      siham.father = 4;
      steps.push("Father gets 1/6 fixed share because deceased left a male descendant (Son/Grandson).");
    } else if (hasDaughters || hasGranddaughters) {
      // If only female descendants, Father gets 1/6 AND acts as Residuary
      siham.father = 4;
      fatherIsResiduary = true;
      steps.push("Father gets 1/6 fixed share and is also eligible for Residue (Asabah) because deceased left daughters but no sons.");
    } else {
      // Pure residuary
      siham.father = 0;
      fatherIsResiduary = true;
      steps.push("Father is a pure Residuary (Asabah) because deceased left no descendants.");
    }
  }

  // Paternal Grandfather
  let grandfatherIsResiduary = false;
  if (inputs.hasPaternalGrandfather && !exclusions.paternalGrandfather) {
    if (hasSons || hasGrandsons) {
      siham.paternalGrandfather = 4;
      steps.push("Paternal Grandfather gets 1/6 fixed share (Father is absent, male descendants present).");
    } else if (hasDaughters || hasGranddaughters) {
      siham.paternalGrandfather = 4;
      grandfatherIsResiduary = true;
      steps.push("Paternal Grandfather gets 1/6 fixed share and can receive Residue (Father is absent, only female descendants present).");
    } else {
      siham.paternalGrandfather = 0;
      grandfatherIsResiduary = true;
      steps.push("Paternal Grandfather acts as Residuary (Father and descendants are both absent).");
    }
  }

  // Grandmothers
  let activeGrandmothers = 0;
  if (inputs.hasPaternalGrandmother && !exclusions.paternalGrandmother) activeGrandmothers++;
  if (inputs.hasMaternalGrandmother && !exclusions.maternalGrandmother) activeGrandmothers++;
  if (activeGrandmothers > 0) {
    // Shared 1/6 if multiple, else 1/6 if single => 4 siham
    const shareEach = 4 / activeGrandmothers;
    if (inputs.hasPaternalGrandmother && !exclusions.paternalGrandmother) {
      siham.paternalGrandmother = shareEach;
    }
    if (inputs.hasMaternalGrandmother && !exclusions.maternalGrandmother) {
      siham.maternalGrandmother = shareEach;
    }
    steps.push(`Grandmother(s) share 1/6 fixed share (${activeGrandmothers} grandmother(s) active).`);
  }

  // Daughters (Zawil Furud only if no Sons)
  let daughtersAreFixed = false;
  if (inputs.daughtersCount > 0 && !exclusions.daughters) {
    if (inputs.sonsCount > 0) {
      // Daughters inherit with Suns as Asabah
      siham.daughter = 0;
      steps.push("Daughters inherit as Residuaries (Asabah bi-Ghairihi) alongside living Sons with a 2:1 male-to-female ratio.");
    } else {
      daughtersAreFixed = true;
      siham.daughter = inputs.daughtersCount === 1 ? 12 : 16; // 1/2 or 2/3
      steps.push(`${inputs.daughtersCount} Daughter(s) get ${inputs.daughtersCount === 1 ? "1/2" : "2/3"} fixed share because there are no living sons.`);
    }
  }

  // Granddaughters (if not excluded and no living Sons/Daughters)
  let granddaughtersAreFixed = false;
  if (inputs.granddaughtersCount > 0 && !exclusions.granddaughters) {
    if (inputs.grandsonsCount > 0) {
      siham.granddaughter = 0;
      steps.push("Granddaughters inherit as Residuaries alongside Grandsons (2:1).");
    } else if (inputs.daughtersCount === 1) {
      // Takmilat-us-Sulusayn: 1/6
      granddaughtersAreFixed = true;
      siham.granddaughter = 4;
      steps.push("Granddaughters get 1/6 to complete the 2/3 maximum female sibling/child share, as there is exactly 1 daughter.");
    } else if (inputs.daughtersCount === 0) {
      granddaughtersAreFixed = true;
      siham.granddaughter = inputs.granddaughtersCount === 1 ? 12 : 16;
      steps.push(`Granddaughters get ${inputs.granddaughtersCount === 1 ? "1/2" : "2/3"} fixed share because there are no daughters or sons.`);
    }
  }

  // Maternal Siblings (Uterine)
  if (inputs.maternalSiblingsCount > 0 && !exclusions.maternalSiblings) {
    siham.maternalSiblings = inputs.maternalSiblingsCount === 1 ? 4 : 8; // 1/6 or 1/3 (shared equally)
    steps.push(`${inputs.maternalSiblingsCount} Maternal (Uterine) sibling(s) share ${inputs.maternalSiblingsCount === 1 ? "1/6" : "1/3"} equally.`);
  }

  // Full Sisters (Zawil Furud only if no Full Brothers & no Daughters)
  let fullSistersAreFixed = false;
  let fullSisterIsAsabahMaalGhair = false;
  if (inputs.fullSistersCount > 0 && !exclusions.fullSisters) {
    if (inputs.fullBrothersCount > 0) {
      siham.fullSister = 0;
      steps.push("Full Sisters inherit as Residuaries alongside Full Brothers (2:1).");
    } else if (inputs.daughtersCount > 0 || inputs.granddaughtersCount > 0) {
      // Asabah ma'al Ghair (with daughters)
      siham.fullSister = 0;
      fullSisterIsAsabahMaalGhair = true;
      steps.push("Full Sisters become Residuaries with others (Asabah ma'al Ghair) in the presence of daughters/granddaughters.");
    } else {
      fullSistersAreFixed = true;
      siham.fullSister = inputs.fullSistersCount === 1 ? 12 : 16; // 1/2 or 2/3
      steps.push(`Full Sisters get ${inputs.fullSistersCount === 1 ? "1/2" : "2/3"} fixed share as there are no living Full Brothers or children.`);
    }
  }

  // Paternal Sisters
  let paternalSistersAreFixed = false;
  let paternalSisterIsAsabahMaalGhair = false;
  if (inputs.paternalSistersCount > 0 && !exclusions.paternalSisters) {
    if (inputs.paternalBrothersCount > 0) {
      siham.paternalSister = 0;
      steps.push("Paternal Sisters inherit as Residuaries alongside Paternal Brothers (2:1).");
    } else if (inputs.daughtersCount > 0 || inputs.granddaughtersCount > 0) {
      siham.paternalSister = 0;
      paternalSisterIsAsabahMaalGhair = true;
      steps.push("Paternal Sisters become Residuaries with others (Asabah ma'al Ghair) in back of offspring.");
    } else if (inputs.fullSistersCount === 1 && !exclusions.fullSisters) {
      paternalSistersAreFixed = true;
      siham.paternalSister = 4; // Takmilat-us-Sulusayn: 1/6
      steps.push("Paternal Sisters get 1/6 to complete the 2/3 female share (since there is exactly 1 Full Sister).");
    } else if (inputs.fullSistersCount === 0) {
      paternalSistersAreFixed = true;
      siham.paternalSister = inputs.paternalSistersCount === 1 ? 12 : 16;
      steps.push(`Paternal Sisters get ${inputs.paternalSistersCount === 1 ? "1/2" : "2/3"} fixed share since there are no Full Sisters.`);
    }
  }

  // 5. Raw Sum of Quranic Heirs
  const rawSum = 
    siham.husband + 
    siham.wife + 
    siham.father + 
    siham.mother + 
    siham.daughter + 
    siham.granddaughter + 
    siham.paternalGrandfather + 
    siham.paternalGrandmother + 
    siham.maternalGrandmother + 
    siham.maternalSiblings + 
    siham.fullSister + 
    siham.paternalSister;

  let adjustmentType: 'normal' | 'aoul' | 'radd' = 'normal';
  const finalFractions: Record<string, number> = {};

  // Compute Residue space
  const rawFractionSum = rawSum / 24;

  if (rawSum > 24) {
    // AL-AOUL case: Sum exceeds 1. We increase the base from 24 to rawSum.
    adjustmentType = 'aoul';
    steps.push(`Al-Aoul (Over-allocation): Sum of Quranic shares is ${rawSum}/24, which exceeds 1. The denominator is expanded from 24 to ${rawSum} to reduce all shares proportionately.`);
    
    // Set final shares proportionally, Residuaries get 0
    Object.keys(siham).forEach(key => {
      finalFractions[key] = siham[key] / rawSum;
    });
  } else if (rawSum < 24) {
    // Check if there are active Residuaries
    // Son or Grandson or Brothers or Paternal Brothers or Father (acting as residuary) or Grandfather (acting as residuary)
    const hasActiveResiduaries = 
      hasSons || 
      (hasGrandsons && !exclusions.grandsons) ||
      fatherIsResiduary ||
      grandfatherIsResiduary ||
      (hasFullBrothers && !exclusions.fullBrothers) ||
      fullSisterIsAsabahMaalGhair ||
      (inputs.paternalBrothersCount > 0 && !exclusions.paternalBrothers) ||
      paternalSisterIsAsabahMaalGhair;

    if (hasActiveResiduaries) {
      // Normal division where we distribute fixed shares over 24, and give the remainder to the residuaries
      adjustmentType = 'normal';
      Object.keys(siham).forEach(key => {
        finalFractions[key] = siham[key] / 24;
      });
      
      const residueFraction = (24 - rawSum) / 24;
      steps.push(`Residue of ${(residueFraction * 100).toFixed(2)}% (${(24 - rawSum)}/24) remains for Residuaries (Asabah).`);
      
      // Determine the highest priority group of Residuaries
      if (hasSons) {
        // Son and Daughter (2:1)
        const totalUnits = (inputs.sonsCount * 2) + inputs.daughtersCount;
        const perUnit = residueFraction / totalUnits;
        finalFractions.sonsResidue = perUnit * 2 * inputs.sonsCount;
        finalFractions.daughtersResidue = perUnit * inputs.daughtersCount;
        steps.push(`Residue divided among ${inputs.sonsCount} Son(s) and ${inputs.daughtersCount} Daughter(s) in a 2:1 ratio (Male:Female).`);
      } 
      else if (hasGrandsons && !exclusions.grandsons) {
        // Grandson and Granddaughter (2:1)
        const totalUnits = (inputs.grandsonsCount * 2) + inputs.granddaughtersCount;
        const perUnit = residueFraction / totalUnits;
        finalFractions.grandsonsResidue = perUnit * 2 * inputs.grandsonsCount;
        finalFractions.granddaughtersResidue = perUnit * inputs.granddaughtersCount;
        steps.push(`Residue divided among ${inputs.grandsonsCount} Grandson(s) and ${inputs.granddaughtersCount} Granddaughter(s) (2:1 ratio).`);
      } 
      else if (fatherIsResiduary) {
        // Father takes all residue (excluding his 1/6 if female lines were active)
        finalFractions.fatherResidue = residueFraction;
        steps.push(`All residue allocated to the Father (highest-ranking Residuary alive).`);
      } 
      else if (grandfatherIsResiduary) {
        finalFractions.grandfatherResidue = residueFraction;
        steps.push(`All residue allocated to the Grandfather (Father is deceased).`);
      } 
      else if (hasFullBrothers || fullSisterIsAsabahMaalGhair) {
        // Full Sibling residuary (2:1)
        const bros = inputs.fullBrothersCount;
        const sis = inputs.fullSistersCount;
        const totalUnits = (bros * 2) + sis;
        if (totalUnits > 0) {
          const perUnit = residueFraction / totalUnits;
          finalFractions.fullBrothersResidue = perUnit * 2 * bros;
          finalFractions.fullSistersResidue = perUnit * sis;
          steps.push(`Residue divided among Full Sibling(s) (2:1 ratio).`);
        }
      } 
      else if ((inputs.paternalBrothersCount > 0 && !exclusions.paternalBrothers) || paternalSisterIsAsabahMaalGhair) {
        const bros = inputs.paternalBrothersCount;
        const sis = inputs.paternalSistersCount;
        const totalUnits = (bros * 2) + sis;
        if (totalUnits > 0) {
          const perUnit = residueFraction / totalUnits;
          finalFractions.paternalBrothersResidue = perUnit * 2 * bros;
          finalFractions.paternalSistersResidue = perUnit * sis;
          steps.push(`Residue divided among Paternal Sibling(s) (2:1 ratio).`);
        }
      }
    } else {
      // AL-RADD case: Surplus remains, and no residuaries are there to claim it!
      // Classic rule: Spouse gets fixed share, No Radd is returned to spouses.
      // Other Quranic Heirs share the remainder in proportion to their siham.
      adjustmentType = 'radd';
      
      const spouseSiham = siham.husband + siham.wife;
      const nonSpouseSiham = rawSum - spouseSiham;
      
      if (nonSpouseSiham === 0) {
        // Only spouses exist! Under modern state codes, if only spouses remain, they can inherit the residue via Radd.
        steps.push("Al-Radd: Only spouse survives. Spouses classically don't get Radd, but since no other heirs exist, 100% of the estate is returned to the spouse.");
        if (siham.husband > 0) finalFractions.husband = 1.0;
        else if (siham.wife > 0) finalFractions.wife = 1.0;
      } else {
        steps.push(`Al-Radd (Return of Surplus): Quranic Heirs get their fixed shares, and the remaining ${24 - rawSum}/24 surplus is shared among non-spouse Quranic Heirs in proportion to their fixed shares.`);
        
        // Spouse gets original fixed fraction
        if (siham.husband > 0) finalFractions.husband = siham.husband / 24;
        if (siham.wife > 0) finalFractions.wife = siham.wife / 24;
        
        const totalDistributedToSpouse = (siham.husband + siham.wife) / 24;
        const remainingForRaddDistribution = 1.0 - totalDistributedToSpouse;
        
        // Distribute the remaining estate to non-spouses proportionally to their relative siham
        Object.keys(siham).forEach(key => {
          if (key !== 'husband' && key !== 'wife' && siham[key] > 0) {
            const relativeWeight = siham[key] / nonSpouseSiham;
            finalFractions[key] = relativeWeight * remainingForRaddDistribution;
          }
        });
      }
    }
  } else {
    // Raw sum is exactly 24 => 1.0 perfectly allocated
    adjustmentType = 'normal';
    Object.keys(siham).forEach(key => {
      finalFractions[key] = siham[key] / 24;
    });
    steps.push("Shares are balanced. Sum equals exactly 1.0 (24/24). Perfect distribution.");
  }

  // 6. Map results, calculate decimals and currency values
  const addHeirResult = (relationship: string, arabicName: string, count: number, valueKey: string, type: 'sharer' | 'residuary'): void => {
    if (count <= 0) return;
    
    const fractionVal = finalFractions[valueKey] || 0;
    const percentage = fractionVal * 100;
    const amount = fractionVal * netEstate;
    
    // Compute readable base share string
    let baseShareStr = "0";
    if (type === 'sharer' && siham[valueKey] > 0) {
      const nom = siham[valueKey];
      const denom = 24;
      // reduce fraction
      const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
      const divisor = gcd(nom, denom);
      baseShareStr = `${nom / divisor}/${denom / divisor}`;
      if (adjustmentType === 'aoul') {
        const aoulDivisor = gcd(nom, rawSum);
        baseShareStr = `${nom / aoulDivisor}/${rawSum / aoulDivisor} (Reduced by Aoul from ${nom / divisor}/${denom / divisor})`;
      } else if (adjustmentType === 'radd') {
        baseShareStr = `${(percentage).toFixed(1)}% (Increased by Radd)`;
      }
    } else if (type === 'residuary') {
      baseShareStr = "Residue (Asabah)";
    }
    
    heirs.push({
      relationship,
      arabicName,
      count,
      isExcluded: false,
      baseShare: baseShareStr,
      percentage,
      amount,
      type
    });
  };

  // Add all active non-excluded heirs
  
  // Spouse
  if (inputs.spouseCount > 0) {
    if (inputs.gender === 'female') {
      if (exclusions.husband) {
        heirs.push(handleExclusion("Husband", "Zowj", 1, exclusions.husband));
      } else {
        addHeirResult("Husband", "Zowj", 1, 'husband', 'sharer');
      }
    } else {
      if (exclusions.wife) {
        heirs.push(handleExclusion("Wife/Wives", "Zowjah", inputs.spouseCount, exclusions.wife));
      } else {
        addHeirResult("Wife/Wives", "Zowjah", inputs.spouseCount, 'wife', 'sharer');
      }
    }
  }

  // Parents
  if (inputs.hasFather) {
    if (exclusions.father) heirs.push(handleExclusion("Father", "Ab", 1, exclusions.father));
    else {
      // Could have sharer part and residue part
      const sharerFraction = finalFractions.father || 0;
      const residueFraction = finalFractions.fatherResidue || 0;
      const totalFraction = sharerFraction + residueFraction;
      
      const percentage = totalFraction * 100;
      const amount = totalFraction * netEstate;
      let shareType: 'sharer' | 'residuary' = 'sharer';
      let baseShareStr = "";
      
      if (sharerFraction > 0 && residueFraction > 0) {
        baseShareStr = "1/6 + Residue";
      } else if (residueFraction > 0) {
        baseShareStr = "Residue (Asabah)";
        shareType = 'residuary';
      } else {
        baseShareStr = "1/6";
      }
      
      heirs.push({
        relationship: "Father",
        arabicName: "Ab",
        count: 1,
        isExcluded: false,
        baseShare: baseShareStr,
        percentage,
        amount,
        type: shareType
      });
    }
  }

  if (inputs.hasMother) {
    if (exclusions.mother) heirs.push(handleExclusion("Mother", "Umm", 1, exclusions.mother));
    else addHeirResult("Mother", "Umm", 1, 'mother', 'sharer');
  }

  // Children
  if (inputs.sonsCount > 0) {
    if (exclusions.sons) heirs.push(handleExclusion("Son", "Ibn", inputs.sonsCount, exclusions.sons));
    else addHeirResult("Son", "Ibn", inputs.sonsCount, 'sonsResidue', 'residuary');
  }

  if (inputs.daughtersCount > 0) {
    if (exclusions.daughters) heirs.push(handleExclusion("Daughter", "Bint", inputs.daughtersCount, exclusions.daughters));
    else {
      if (daughtersAreFixed) {
        addHeirResult("Daughter", "Bint", inputs.daughtersCount, 'daughter', 'sharer');
      } else {
        addHeirResult("Daughter", "Bint", inputs.daughtersCount, 'daughtersResidue', 'residuary');
      }
    }
  }

  // Grandsons / Granddaughters
  if (inputs.grandsonsCount > 0) {
    if (exclusions.grandsons) heirs.push(handleExclusion("Grandson (Son's Son)", "Ibn Ibn", inputs.grandsonsCount, exclusions.grandsons));
    else addHeirResult("Grandson (Son's Son)", "Ibn Ibn", inputs.grandsonsCount, 'grandsonsResidue', 'residuary');
  }

  if (inputs.granddaughtersCount > 0) {
    if (exclusions.granddaughters) heirs.push(handleExclusion("Granddaughter (Son's Daughter)", "Bint Ibn", inputs.granddaughtersCount, exclusions.granddaughters));
    else {
      if (granddaughtersAreFixed) addHeirResult("Granddaughter (Son's Daughter)", "Bint Ibn", inputs.granddaughtersCount, 'granddaughter', 'sharer');
      else addHeirResult("Granddaughter (Son's Daughter)", "Bint Ibn", inputs.granddaughtersCount, 'granddaughtersResidue', 'residuary');
    }
  }

  // Sibling classifications
  if (inputs.fullBrothersCount > 0) {
    if (exclusions.fullBrothers) heirs.push(handleExclusion("Full Brother", "Shaqeeq", inputs.fullBrothersCount, exclusions.fullBrothers));
    else addHeirResult("Full Brother", "Shaqeeq", inputs.fullBrothersCount, 'fullBrothersResidue', 'residuary');
  }

  if (inputs.fullSistersCount > 0) {
    if (exclusions.fullSisters) heirs.push(handleExclusion("Full Sister", "Shaqeeqah", inputs.fullSistersCount, exclusions.fullSisters));
    else {
      if (fullSistersAreFixed) addHeirResult("Full Sister", "Shaqeeqah", inputs.fullSistersCount, 'fullSister', 'sharer');
      else addHeirResult("Full Sister", "Shaqeeqah", inputs.fullSistersCount, 'fullSistersResidue', 'residuary');
    }
  }

  if (inputs.paternalBrothersCount > 0) {
    if (exclusions.paternalBrothers) heirs.push(handleExclusion("Paternal Brother", "Akh li-Ab", inputs.paternalBrothersCount, exclusions.paternalBrothers));
    else addHeirResult("Paternal Brother", "Akh li-Ab", inputs.paternalBrothersCount, 'paternalBrothersResidue', 'residuary');
  }

  if (inputs.paternalSistersCount > 0) {
    if (exclusions.paternalSisters) {
      heirs.push(handleExclusion("Paternal Sister", "Ukht li-Ab", inputs.paternalSistersCount, exclusions.paternalSisters));
    } else {
      if (paternalSistersAreFixed) addHeirResult("Paternal Sister", "Ukht li-Ab", inputs.paternalSistersCount, 'paternalSister', 'sharer');
      else addHeirResult("Paternal Sister", "Ukht li-Ab", inputs.paternalSistersCount, 'paternalSistersResidue', 'residuary');
    }
  }

  if (inputs.maternalSiblingsCount > 0) {
    if (exclusions.maternalSiblings) heirs.push(handleExclusion("Maternal (Uterine) Sibling", "Akh/Ukht li-Umm", inputs.maternalSiblingsCount, exclusions.maternalSiblings));
    else addHeirResult("Maternal (Uterine) Sibling", "Akh/Ukht li-Umm", inputs.maternalSiblingsCount, 'maternalSiblings', 'sharer');
  }

  // Grandparents
  if (inputs.hasPaternalGrandfather) {
    if (exclusions.paternalGrandfather) {
      heirs.push(handleExclusion("Paternal Grandfather", "Jadd-ul-Sahih", 1, exclusions.paternalGrandfather));
    } else {
      const sharerFraction = finalFractions.paternalGrandfather || 0;
      const residueFraction = finalFractions.grandfatherResidue || 0;
      const totalFraction = sharerFraction + residueFraction;
      const percentage = totalFraction * 100;
      const amount = totalFraction * netEstate;
      let shareType: 'sharer' | 'residuary' = 'sharer';
      let baseShareStr = "";
      
      if (sharerFraction > 0 && residueFraction > 0) {
        baseShareStr = "1/6 + Residue";
      } else if (residueFraction > 0) {
        baseShareStr = "Residue (Asabah)";
        shareType = 'residuary';
      } else {
        baseShareStr = "1/6";
      }
      heirs.push({
        relationship: "Paternal Grandfather",
        arabicName: "Jadd-ul-Sahih",
        count: 1,
        isExcluded: false,
        baseShare: baseShareStr,
        percentage,
        amount,
        type: shareType
      });
    }
  }

  if (inputs.hasPaternalGrandmother) {
    if (exclusions.paternalGrandmother) {
      heirs.push(handleExclusion("Paternal Grandmother", "Jaddah li-Ab", 1, exclusions.paternalGrandmother));
    } else {
      addHeirResult("Paternal Grandmother", "Jaddah li-Ab", 1, 'paternalGrandmother', 'sharer');
    }
  }

  if (inputs.hasMaternalGrandmother) {
    if (exclusions.maternalGrandmother) {
      heirs.push(handleExclusion("Maternal Grandmother", "Jaddah li-Umm", 1, exclusions.maternalGrandmother));
    } else {
      addHeirResult("Maternal Grandmother", "Jaddah li-Umm", 1, 'maternalGrandmother', 'sharer');
    }
  }

  // Ensure total sum of amounts equals netEstate (handles tiny float rounding leftovers)
  let sumDistributed = heirs.reduce((acc, h) => acc + h.amount, 0);
  
  if (sumDistributed !== netEstate && sumDistributed > 0 && heirs.some(h => !h.isExcluded)) {
    const errorDiff = netEstate - sumDistributed;
    // Distribute small diff to the largest active heir to ensure precision
    const activeHeirs = heirs.filter(h => !h.isExcluded && h.amount > 0);
    if (activeHeirs.length > 0) {
      const largestHeir = activeHeirs.reduce((max, h) => h.amount > max.amount ? h : max, activeHeirs[0]);
      largestHeir.amount += errorDiff;
      sumDistributed = netEstate;
    }
  }

  return {
    inputs,
    netEstate,
    debtsDeducted: debts,
    funeralDeducted: funeral,
    bequestsDeducted: bequest,
    bequestCapped,
    totalDistributed: sumDistributed,
    rawSihamSum: rawSum,
    adjustmentType,
    heirs,
    steps,
  };
}
