export default function test(request: Request, res: any) {
  console.log(res);
  return res.status(200).json({ ok: true });
}
