package com.pawcare.service;

import com.pawcare.entity.*;
import com.pawcare.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class PawCareService {

    @Autowired
    private PetRepository petRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OperationLogRepository operationLogRepository;

    // Pet operations
    public List<Pet> getAllPets() {
        return petRepository.findAll();
    }

    public Optional<Pet> getPetById(Long id) {
        return petRepository.findById(id);
    }

    public Pet savePet(Pet pet) {
        Pet savedPet = petRepository.save(pet);
        logOperation("PET_CREATED", "Added pet " + savedPet.getName(), savedPet.getId());
        return savedPet;
    }

    public Pet updatePet(Long id, Pet pet) {
        pet.setId(id);
        Pet updatedPet = petRepository.save(pet);
        logOperation("PET_UPDATED", "Updated pet " + updatedPet.getName(), updatedPet.getId());
        return updatedPet;
    }

    public void deletePet(Long id) {
        Optional<Pet> pet = petRepository.findById(id);
        if (pet.isPresent()) {
            logOperation("PET_DELETED", "Deleted pet " + pet.get().getName(), id);
            petRepository.deleteById(id);
        }
    }

    public Pet addProcedureToPet(Long petId, Procedure procedure) {
        Optional<Pet> petOpt = petRepository.findById(petId);
        if (petOpt.isPresent()) {
            Pet pet = petOpt.get();
            procedure.setPet(pet);
            pet.getProcedures().add(procedure);
            return petRepository.save(pet);
        }
        throw new RuntimeException("Pet not found with id: " + petId);
    }

    // Appointment operations
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public Optional<Appointment> getAppointmentById(Long id) {
        return appointmentRepository.findById(id);
    }

    public Appointment saveAppointment(Appointment appointment) {
        appointment.setStatus("Pending");
        Appointment savedAppointment = appointmentRepository.save(appointment);
        logOperation("APPT_CREATED", "Appointment created for " + savedAppointment.getOwner(), savedAppointment.getPetId());
        return savedAppointment;
    }

    public Appointment updateAppointment(Long id, Appointment appointment) {
        appointment.setId(id);
        return appointmentRepository.save(appointment);
    }

    public void deleteAppointment(Long id) {
        logOperation("APPT_DELETED", "Removed appointment #" + id, null);
        appointmentRepository.deleteById(id);
    }

    public Appointment approveAppointment(Long id) {
        Optional<Appointment> appointmentOpt = appointmentRepository.findById(id);
        if (appointmentOpt.isPresent()) {
            Appointment appointment = appointmentOpt.get();
            appointment.setStatus("Approved by Vet");
            logOperation("APPT_APPROVED", "Appointment approved for " + appointment.getOwner(), appointment.getPetId());
            return appointmentRepository.save(appointment);
        }
        throw new RuntimeException("Appointment not found with id: " + id);
    }

    public Appointment markAppointmentDone(Long id) {
        Optional<Appointment> appointmentOpt = appointmentRepository.findById(id);
        if (appointmentOpt.isPresent()) {
            Appointment appointment = appointmentOpt.get();
            appointment.setStatus("Done");
            appointment.setCompletedAt(LocalDate.now());
            logOperation("APPT_DONE", "Appointment done for " + appointment.getOwner(), appointment.getPetId());
            return appointmentRepository.save(appointment);
        }
        throw new RuntimeException("Appointment not found with id: " + id);
    }

    // Prescription operations
    public List<Prescription> getAllPrescriptions() {
        return prescriptionRepository.findAll();
    }

    public Optional<Prescription> getPrescriptionById(Long id) {
        return prescriptionRepository.findById(id);
    }

    public Prescription savePrescription(Prescription prescription) {
        Prescription savedPrescription = prescriptionRepository.save(prescription);
        logOperation("RX_CREATED", "Rx issued for " + savedPrescription.getPet() + " (" + savedPrescription.getDrug() + ")", savedPrescription.getPetId());
        return savedPrescription;
    }

    public Prescription updatePrescription(Long id, Prescription prescription) {
        prescription.setId(id);
        return prescriptionRepository.save(prescription);
    }

    public void deletePrescription(Long id) {
        prescriptionRepository.deleteById(id);
    }

    public Prescription dispensePrescription(Long id) {
        Optional<Prescription> prescriptionOpt = prescriptionRepository.findById(id);
        if (prescriptionOpt.isPresent()) {
            Prescription prescription = prescriptionOpt.get();
            prescription.setDispensed(true);
            prescription.setDispensedAt(LocalDate.now());
            logOperation("RX_DISPENSED", "Rx dispensed for " + prescription.getPet(), prescription.getPetId());
            return prescriptionRepository.save(prescription);
        }
        throw new RuntimeException("Prescription not found with id: " + id);
    }

    // User operations
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public User updateUser(Long id, User user) {
        user.setId(id);
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    // Operation log operations
    public List<OperationLog> getOperationLogsBetween(LocalDate from, LocalDate to) {
        return operationLogRepository.findByDateRange(from, to);
    }

    private void logOperation(String type, String message, Long petId) {
        OperationLog log = new OperationLog();
        log.setTs(LocalDateTime.now());
        log.setType(type);
        log.setMessage(message);
        log.setPetId(petId);
        operationLogRepository.save(log);
    }
}

