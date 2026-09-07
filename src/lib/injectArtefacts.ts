import xPostAshworth from "@/assets/x_post_ashworth.jpg";
import xPostMeridian from "@/assets/x_post_meridian.jpg";
import xPostBristow from "@/assets/x_post_bristow.jpg";

/**
 * Pre-rendered fictional X (Twitter) post screenshots per simulation company.
 * Used as the circulating artefact on social-post injects.
 */
export const X_POST_SCREENSHOTS: Record<string, string> = {
  "ashworth-reilly": xPostAshworth,
  "meridian-vale": xPostMeridian,
  "bristow-calder": xPostBristow,
};

export const getXPostScreenshot = (companyId?: string) =>
  companyId ? X_POST_SCREENSHOTS[companyId] : undefined;
