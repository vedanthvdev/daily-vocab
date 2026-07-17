export const ONE_LINER_MIN = 10;

export function isBrokenOneLiner(oneLiner: string): boolean {
  const o = oneLiner.trim();
  if (!o) return true;
  if (o.length < ONE_LINER_MIN) return true;
  // Complete glosses end with sentence punctuation.
  if (!/[.!?]"?$/.test(o)) return true;
  if (/\.\.$/.test(o)) return true;
  if (/\([^)]*$/.test(o)) return true;
  if (/[—–]\.?$/.test(o) || / —\.$/.test(o)) return true;
  // Cut mid-phrase: trailing article / coordinating fragment.
  if (/\b(a|an|the|or|and)\.?$/i.test(o)) return true;
  if (
    /^(He |She |They |Ms\.|Mr\.|At the moment|Shopkeepers|Young |If America|Many people use|If you've|When speech|It is sincerely|The device of)/.test(
      o,
    )
  ) {
    return true;
  }
  if (
    /\b(they will|out ways|reduced consumer|to produce|an enemy|every tenth|especially if|but Ms|gained|just|like)\.$/i.test(
      o,
    )
  ) {
    return true;
  }
  // Mid-sentence cuts common in scraped dictionary text.
  if (
    /, (a|an|the|or|and|of|to|its|his|her)\.?$/i.test(o) ||
    /\b(trick or|art of|to its|similar to|after a|in a|home, or|before an|to the|ground or|life is|sense of|especially of|especially with|appear in|produced by|nearest to|time of|momentous or|intention of|role or|by a|place to|due to|purpose of|with the|to be|group or|heartburn or|deprivation or|death and|fates of|cannot be|permit the|differ in|associated with|households or|from the|inductance and|fresh or|participant his|benefit from|circumvented or)\.?$/i.test(
      o,
    )
  ) {
    return true;
  }
  return false;
}

export const ESL_DENYLIST = new Set(
  `
  able about after again air also always animal apple ask away back bad bag ball
  bank bed big bird black blue boat book box boy brother building business buy
  call car cat check child children city class cold color come country day dog
  door drink eat egg eye face family father find fish food friend girl good green
  hand happy head help home horse hot house husband job kind land large laugh
  learn leave left letter life light like live long look love make man many
  mother mountain music name net new night note number old open paper people play
  rain raft read red right room run school sea see ship shoe sister small snow
  song start stop street student sun table tea teach time tree walk water white
  woman word work world year young arch canine
  `
    .trim()
    .split(/\s+/),
);
