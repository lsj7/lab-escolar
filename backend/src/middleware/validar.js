// Valida req.body contra un esquema de Zod. Si todo está bien, deja los datos
// limpios en req.datos (Zod elimina cualquier campo que no esté en el esquema,
// así nadie puede colar campos como "rol": "admin").
export const validar = (esquema) => (req, res, next) => {
  const resultado = esquema.safeParse(req.body ?? {});
  if (!resultado.success) {
    const detalles = {};
    for (const problema of resultado.error.issues) {
      const campo = problema.path.join('.') || 'general';
      detalles[campo] ??= problema.message;
    }
    return res.status(400).json({ error: 'Revisa los datos marcados', detalles });
  }
  req.datos = resultado.data;
  next();
};

export function validarId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identificador inválido' });
  }
  req.id = id;
  next();
}
