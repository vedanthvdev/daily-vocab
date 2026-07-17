export const ONE_LINER_MIN = 10;

export function isBrokenOneLiner(oneLiner: string): boolean {
  const o = oneLiner.trim();
  if (!o) return true;
  if (/\.\.$/.test(o)) return true;
  if (/\([^)]*$/.test(o)) return true;
  if (/[—–]\.?$/.test(o) || / —\.$/.test(o)) return true;
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
