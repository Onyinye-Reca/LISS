import { Request, Response } from "express";
import { controller, httpGet } from "inversify-express-utils";
import { issueCsrfToken } from "../middleware/csrf";

@controller("/csrf")
export class CsrfController {
  /** Issues a CSRF token (cookie + body). The web app calls this on load. */
  @httpGet("/")
  index(_req: Request, res: Response) {
    const csrfToken = issueCsrfToken(res);
    res.json({ csrfToken });
  }
}
