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
        private readonly DbChoosingContext _choosingContext;

        public EventRepository(DbChoosingContext choosingContext)
        {
            _choosingContext = choosingContext;
        }

        public async Task<List<EventModel>> GetAllAsync()
        {
            try
            {
                return await _choosingContext.Events.ToListAsync();
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
                return await _choosingContext.Events.FindAsync(id);
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
                newEvent.FechaInicio = newEvent.FechaInicio.ToLocalTime();
                newEvent.FechaFin = newEvent.FechaFin.ToLocalTime();

                await _choosingContext.Events.AddAsync(newEvent);
                await _choosingContext.SaveChangesAsync();
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
                var existingEvent = await _choosingContext.Events.FindAsync(updatedEvent.Id);
                if (existingEvent == null)
                    throw new Exception($"Event with ID {updatedEvent.Id} not found");

                // Actualizar solo los campos necesarios
                existingEvent.Nombre = updatedEvent.Nombre;
                existingEvent.Descripcion = updatedEvent.Descripcion;
                existingEvent.Ubicacion = updatedEvent.Ubicacion;
                existingEvent.FechaInicio = updatedEvent.FechaInicio.ToLocalTime();
                existingEvent.FechaFin = updatedEvent.FechaFin.ToLocalTime();
                existingEvent.Activo = updatedEvent.Activo;
                existingEvent.PermitirAccesoPostEvento = updatedEvent.PermitirAccesoPostEvento;

                // Solo actualizar ConfiguracionJson si viene con datos
                if (!string.IsNullOrEmpty(updatedEvent.ConfiguracionJson))
                    existingEvent.ConfiguracionJson = updatedEvent.ConfiguracionJson;

                await _choosingContext.SaveChangesAsync();
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
                var eventToDelete = await _choosingContext.Events.FindAsync(id);
                if (eventToDelete != null)
                {
                    _choosingContext.Events.Remove(eventToDelete);
                    await _choosingContext.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Error deleting event with ID {id}", ex);
            }
        }

        // Obtener eventos de un organizador específico
        public async Task<List<EventModel>> GetByOrganizadorIdAsync(int organizadorId)
        {
            try
            {
                return await _choosingContext.Events
                    .Where(e => e.OrganizadorId == organizadorId)
                    .OrderByDescending(e => e.FechaInicio)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving events for organizador {organizadorId}", ex);
            }
        }
    }
}
