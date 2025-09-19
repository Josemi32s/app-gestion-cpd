// src/components/UserEditForm.tsx
import { useState, useEffect } from 'react';
import { updateUsuario } from '../services/api';
import type{ Usuario, UsuarioCreate, Rol } from '../types';
import toast from 'react-hot-toast';

interface UserEditFormProps {
  usuario: Usuario;
  roles: Rol[];
  onSave: () => void;
  onCancel: () => void;
}

const UserEditForm = ({ usuario, roles, onSave, onCancel }: UserEditFormProps) => {
  const [formData, setFormData] = useState<UsuarioCreate>({
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    usuario: usuario.usuario,
    fecha_ingreso: usuario.fecha_ingreso.split('T')[0],
    fecha_salida: usuario.fecha_salida ? usuario.fecha_salida.split('T')[0] : undefined,
    estado: usuario.estado,
    rol_id: usuario.rol_id,
    telefono: usuario.telefono,
    cumple_anios: usuario.cumple_anios ? usuario.cumple_anios.split('T')[0] : undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formValid, setFormValid] = useState(false);

  // Regex
  const soloLetrasRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
  const soloNumerosRegex = /^[0-9]{0,9}$/;

  const validarCampo = (name: string, value: string) => {
    let error = '';

    if (name === 'nombres' || name === 'apellidos') {
      if (!value.trim()) {
        error = `${name === 'nombres' ? 'Nombres' : 'Apellidos'} es obligatorio`;
      } else if (!soloLetrasRegex.test(value)) {
        error = 'Solo se permiten letras y espacios';
      }
    }

    if (name === 'telefono') {
      if (value && !soloNumerosRegex.test(value)) {
        error = 'Solo se permiten números (máx. 9 dígitos)';
      }
    }

    if (name === 'usuario') {
      if (!value.trim()) {
        error = 'Usuario es obligatorio';
      }
    }

    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validarFormulario = () => {
    const nuevosErrores: Record<string, string> = {};

    if (!formData.nombres.trim()) {
      nuevosErrores.nombres = 'Nombres es obligatorio';
    } else if (!soloLetrasRegex.test(formData.nombres)) {
      nuevosErrores.nombres = 'Solo se permiten letras y espacios';
    }

    if (!formData.apellidos.trim()) {
      nuevosErrores.apellidos = 'Apellidos es obligatorio';
    } else if (!soloLetrasRegex.test(formData.apellidos)) {
      nuevosErrores.apellidos = 'Solo se permiten letras y espacios';
    }

    if (!formData.usuario.trim()) {
      nuevosErrores.usuario = 'Usuario es obligatorio';
    }

    if (formData.telefono && !soloNumerosRegex.test(formData.telefono)) {
      nuevosErrores.telefono = 'Solo se permiten números (máx. 9 dígitos)';
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  useEffect(() => {
    setFormValid(validarFormulario());
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'telefono') {
      if (value === '' || soloNumerosRegex.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
        validarCampo(name, value);
      }
      return;
    }

    if (name === 'nombres' || name === 'apellidos') {
      if (soloLetrasRegex.test(value) || value === '') {
        setFormData(prev => ({ ...prev, [name]: value }));
        validarCampo(name, value);
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    validarCampo(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    setLoading(true);

    try {
      await updateUsuario(usuario.id, formData);
      toast.success('Usuario actualizado correctamente');
      onSave();
    } catch (err: any) {
      toast.error('❌ Error al actualizar usuario: ' + (err.response?.data?.detail || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombres *</label>
          <input
            type="text"
            name="nombres"
            value={formData.nombres}
            onChange={handleChange}
            required
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 ${
              errors.nombres ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {errors.nombres && <p className="mt-1 text-sm text-red-600">{errors.nombres}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Apellidos *</label>
          <input
            type="text"
            name="apellidos"
            value={formData.apellidos}
            onChange={handleChange}
            required
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 ${
              errors.apellidos ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {errors.apellidos && <p className="mt-1 text-sm text-red-600">{errors.apellidos}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Usuario *</label>
          <input
            type="text"
            name="usuario"
            value={formData.usuario}
            onChange={handleChange}
            required
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 ${
              errors.usuario ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {errors.usuario && <p className="mt-1 text-sm text-red-600">{errors.usuario}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono</label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono || ''}
            onChange={handleChange}
            maxLength={9}
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 ${
              errors.telefono ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {errors.telefono && <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>}
          <p className="mt-1 text-xs text-gray-500">Máximo 9 dígitos</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Cumpleaños</label>
          <input
            type="date"
            name="cumple_anios"
            value={formData.cumple_anios || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha Ingreso *</label>
          <input
            type="date"
            name="fecha_ingreso"
            value={formData.fecha_ingreso}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Rol *</label>
          <select
            name="rol_id"
            value={formData.rol_id}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {roles.map(rol => (
              <option key={rol.id} value={rol.id}>{rol.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !formValid}
          className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
            loading || !formValid
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );
};

export default UserEditForm;