import { ApplicationException } from '../common/errors/application.exception';
import { Usuario, Permiso, RolPermiso, UsuarioSucursal, Sucursal, Comercio, Rol } from '../models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ILoginDto, ILoginResponse, IUserDto, IRefreshTokenResponse } from '../dtos/IAuth';
import { IComercioPublicInfo } from '../dtos/IComercio';
export class AuthService {
  /**
   * Determina la sucursal por defecto para un usuario:
   * - Si el usuario tiene acceso a la sucursal marcada como principal, usa esa.
   * - Si no, usa la primera del array.
   */
  private determinarSucursalDefault(sucursales: number[]): number | null {
    if (!sucursales || sucursales.length === 0) return null;
    // Buscar si alguna de las asignadas es la principal (se resuelve en login)
    return sucursales[0]; // por defecto la primera, el login sobreescribe si encuentra principal
  }
  async login(loginDto: ILoginDto): Promise<ILoginResponse> {
    try {
      const { username, password, slug } = loginDto;
      const user = await Usuario.findOne({
        where: { login: username, condicion: 1 }
      });
      if (!user) {
        throw new ApplicationException('Usuario o contraseña incorrectos', 401);
      }
      const userData = user.get() as any;
      const isPasswordValid = await this.verifyPassword(password, userData.clave);
      if (!isPasswordValid) {
        throw new ApplicationException('Usuario o contraseña incorrectos', 401);
      }
      // Validar multi-tenant por subdominio
      if (slug) {
        const comercio = await Comercio.findByPk(userData.idcomercio);
        if (!comercio || (comercio.get() as any).nickname !== slug) {
          throw new ApplicationException('Usuario o contraseña incorrectos', 401);
        }
      }
      const rolePermissions = await this.getRolePermissions(userData.idrol);
      const permisos = rolePermissions;
      const sucursales = await this.getUserSucursales(userData.idusuario);
      // Obtener nombre del rol
      let rolName: string | undefined;
      if (userData.idrol) {
        const roleRow = await Rol.findByPk(userData.idrol, { attributes: ['nombre'] });
        rolName = (roleRow as any)?.nombre;
      }
      // Determinar idsucursal por defecto
      let idsucursal: number | null = null;
      if (sucursales.length > 0) {
        // Usar la primera sucursal asignada (el frontend puede cambiarla vÃÆÃÂ­a SucursalSwitcher)
        idsucursal = sucursales[0];
      }
      // Generar tokens
      const token = this.generateAccessToken(userData, permisos, rolePermissions, sucursales, idsucursal);
      const refreshToken = this.generateRefreshToken(userData, permisos, rolePermissions, sucursales, idsucursal);
      // Migrar SHA256 legacy a bcrypt
      if (this.isSha256Hash(userData.clave)) {
        const newHash = bcrypt.hashSync(password, 10);
        await Usuario.update({ clave: newHash }, { where: { idusuario: userData.idusuario } });
      }
      return {
        ok: true,
        token,
        refreshToken,
        user: {
          idusuario: userData.idusuario,
          nombre: userData.nombre,
          tipo_documento: userData.tipo_documento,
          num_documento: userData.num_documento,
          direccion: userData.direccion,
          telefono: userData.telefono,
          email: userData.email,
          login: userData.login,
          imagen: userData.imagen,
          condicion: userData.condicion,
          idrol: userData.idrol || undefined,
          rol: rolName,
          permisos,
          idcomercio: userData.idcomercio || undefined,
          idsucursal: idsucursal || undefined,
          sucursales,
        }
      };
    } catch (error) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException('Error al iniciar sesión');
    }
  }
  async cambiarSucursal(userId: number, nuevaSucursalId: number): Promise<{ token: string; refreshToken: string; idsucursal: number }> {
    const user = await Usuario.findByPk(userId);
    if (!user) throw new ApplicationException('Usuario no encontrado', 404);
    const userData = user.get() as any;
    const sucursales = await this.getUserSucursales(userId);
    // Verificar que tiene acceso a la nueva sucursal
    if (!sucursales.includes(nuevaSucursalId) && userData.idrol !== 1) {
      throw new ApplicationException('No tiene acceso a esta sucursal', 403);
    }
    const rolePermissions = await this.getRolePermissions(userData.idrol);
    const permisos = rolePermissions;
    const token = this.generateAccessToken(userData, permisos, rolePermissions, sucursales, nuevaSucursalId);
    const refreshToken = this.generateRefreshToken(userData, permisos, rolePermissions, sucursales, nuevaSucursalId);
    return { token, refreshToken, idsucursal: nuevaSucursalId };
  }
  private generateAccessToken(
    userData: any, permisos: string[], rolePermissions: string[] = [],
    sucursales: number[] = [], idsucursal: number | null = null
  ): string {
    const secretKey = process.env.JWT_SECRET_KEY || 'default-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
    return jwt.sign(
      {
        id: userData.idusuario,
        username: userData.login,
        idrol: userData.idrol || null,
        idcomercio: userData.idcomercio || null,
        idsucursal: idsucursal || null,
        sucursales,
        permissions: permisos,
        rolePermissions
      } as object,
      secretKey,
      { expiresIn: expiresIn as any }
    );
  }
  private generateRefreshToken(
    userData: any, permisos: string[], rolePermissions: string[] = [],
    sucursales: number[] = [], idsucursal: number | null = null
  ): string {
    const secretKey = process.env.JWT_SECRET_KEY || 'default-secret';
    const refreshExpires = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    return jwt.sign(
      {
        id: userData.idusuario,
        username: userData.login,
        idrol: userData.idrol || null,
        idcomercio: userData.idcomercio || null,
        idsucursal: idsucursal || null,
        sucursales,
        permissions: permisos,
        rolePermissions,
        isRefresh: true
      } as object,
      secretKey,
      { expiresIn: refreshExpires as any }
    );
  }
  async verifyToken(userId: number): Promise<IUserDto> {
    try {
      const user = await Usuario.findByPk(userId);
      if (!user) throw new ApplicationException('Usuario no encontrado', 404);
      const userData = user.get() as any;
      const rolePermissions = await this.getRolePermissions(userData.idrol);
      const sucursales = await this.getUserSucursales(userId);
      // Obtener nombre del rol
      let rol: string | undefined;
      if (userData.idrol) {
        const roleRow = await Rol.findByPk(userData.idrol, { attributes: ['nombre'] });
        rol = (roleRow as any)?.nombre;
      }
      return {
        idusuario: userData.idusuario,
        nombre: userData.nombre,
        tipo_documento: userData.tipo_documento,
        num_documento: userData.num_documento,
        direccion: userData.direccion,
        telefono: userData.telefono,
        email: userData.email,
        login: userData.login,
        imagen: userData.imagen,
        condicion: userData.condicion,
        idrol: userData.idrol || undefined,
        rol,
        permisos: rolePermissions,
        rolePermissions,
        idcomercio: userData.idcomercio || undefined,
        // idsucursal viene del JWT, no de la BD
        sucursales,
      };
    } catch (error) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException('Error al verificar token');
    }
  }
  async refreshAccessToken(refreshTokenValue: string): Promise<IRefreshTokenResponse> {
    try {
      const secretKey = process.env.JWT_SECRET_KEY || 'default-secret';
      const decoded = jwt.verify(refreshTokenValue, secretKey) as any;
      if (!decoded || !(decoded as any).isRefresh) {
        throw new ApplicationException('Token no válido para renovación', 401);
      }
      const user = await Usuario.findByPk(decoded.id);
      if (!user) throw new ApplicationException('Usuario no encontrado', 404);
      const userData = user.get() as any;
      const rolePermissions = await this.getRolePermissions(userData.idrol);
      const permisos = rolePermissions;
      const sucursales = await this.getUserSucursales(decoded.id);
      const idsucursal = decoded ? (decoded.idsucursal || null) : null;
      const newToken = this.generateAccessToken(userData, permisos, rolePermissions, sucursales, idsucursal);
      return { ok: true, token: newToken };
    } catch (error) {
      if (error instanceof ApplicationException) throw error;
      throw new ApplicationException('Refresh token inválido o expirado', 401);
    }
  }
  async getComercioInfo(slug: string): Promise<IComercioPublicInfo | null> {
    const comercio = await Comercio.findOne({
      where: { nickname: slug, condicion: 1 },
      attributes: ['idcomercio', 'nombre', 'nickname', 'direccion', 'telefono', 'email', 'logo', 'color_primario']
    });
    if (!comercio) return null;
    return comercio.get() as IComercioPublicInfo;
  }
  async getUserSucursales(userId: number): Promise<number[]> {
    const rows = await UsuarioSucursal.findAll({
      where: { idusuario: userId },
      attributes: ['idsucursal']
    });
    return rows.map((r: any) => r.idsucursal);
  }
  private async getRolePermissions(idrol: number | null): Promise<string[]> {
    if (!idrol) return [];
    const rows = await RolPermiso.findAll({
      where: { idrol },
      include: [{ model: Permiso, as: 'permiso', attributes: ['nombre'] }]
    });
    return rows.map((r: any) => r.permiso?.nombre).filter(Boolean);
  }
  private isSha256Hash(hash: string): boolean {
    return /^[a-f0-9]{64}$/i.test(hash);
  }
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!hash) return false;
    if (this.isSha256Hash(hash)) {
      const crypto = await import('crypto');
      const shaHash = crypto.createHash('sha256').update(password).digest('hex');
      return shaHash === hash;
    }
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }
}

