using choosing.Context;
using choosing.Domain;
using choosing.Repository.Interfaces;
using Microsoft.EntityFrameworkCore; // ¡IMPORTANTE! Asegúrate de tener este using
using System;
using System.Collections.Generic;
using System.Linq;


namespace choosing.Repository.Impl
{
    public class EventRepository : IEventRepository
    {
        private readonly DbHotelContext _context;

        public EventRepository(DbHotelContext context)
        {
            _context = context;
        }

        public async Task<List<EventModel>> GetAllAsync()
        {
            try
            {
                return await _context.Events.ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception("Error retrieving all events", ex);
            }
        }

        public async Task<EventModel> GetByIdAsync(int id)
        {
            try
            {
                return await _context.Events.FindAsync(id);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving event with ID {id}", ex);
            }
        }

        public async Task<EventModel> AddAsync(EventModel newEvent)
        {
            try
            {
                await _context.Events.AddAsync(newEvent);
                await _context.SaveChangesAsync();
                return newEvent;
            }
            catch (Exception ex)
            {
                throw new Exception("Error adding new event", ex);
            }
        }

        public async Task UpdateAsync(EventModel updatedEvent)
        {
            try
            {
                // Obtener el evento existente
                var existingEvent = await _context.Events.FindAsync(updatedEvent.Id);
                if (existingEvent == null)
                    throw new Exception($"Event with ID {updatedEvent.Id} not found");

                // Actualizar solo los campos necesarios
                existingEvent.Nombre = updatedEvent.Nombre;
                existingEvent.Descripcion = updatedEvent.Descripcion;
                existingEvent.Ubicacion = updatedEvent.Ubicacion;
                existingEvent.FechaInicio = updatedEvent.FechaInicio;
                existingEvent.FechaFin = updatedEvent.FechaFin;
                existingEvent.Activo = updatedEvent.Activo;
                existingEvent.CodigoAcceso = updatedEvent.CodigoAcceso;
                existingEvent.CodigoAdmin = updatedEvent.CodigoAdmin;
                existingEvent.CodigoStats = updatedEvent.CodigoStats;
                existingEvent.PermitirAccesoPostEvento = updatedEvent.PermitirAccesoPostEvento;

                // Solo actualizar ConfiguracionJson si viene con datos
                if (!string.IsNullOrEmpty(updatedEvent.ConfiguracionJson))
                    existingEvent.ConfiguracionJson = updatedEvent.ConfiguracionJson;

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error updating event: {ex.Message}", ex);
            }
        }

        public async Task DeleteAsync(int id)
        {
            try
            {
                var eventToDelete = await _context.Events.FindAsync(id);
                if (eventToDelete != null)
                {
                    _context.Events.Remove(eventToDelete);
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Error deleting event with ID {id}", ex);
            }
        }
    }
}
