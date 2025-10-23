package com.pawcare.web;

import com.pawcare.entity.*;
import com.pawcare.service.PawCareService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ApiControllers {

    private final PawCareService pawCareService;
    private final String uploadDir;

    public ApiControllers(
            PawCareService pawCareService,
            @Value("${pawcare.upload-dir:uploads}") String uploadDir
    ) {
        this.pawCareService = pawCareService;
        this.uploadDir = (uploadDir == null || uploadDir.isBlank()) ? "uploads" : uploadDir;
        new File(this.uploadDir).mkdirs();
    }

    /* --------- Pets --------- */
    @GetMapping("/pets")
    public List<Pet> listPets(){ return pawCareService.getAllPets(); }

    @GetMapping("/pets/{id}")
    public ResponseEntity<Pet> getPet(@PathVariable long id){
        return pawCareService.getPetById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/pets")
    public Pet createPet(@RequestBody Pet p){
        if (p.getProcedures() == null) p.setProcedures(new ArrayList<>());
        return pawCareService.savePet(p);
    }

    @PutMapping("/pets/{id}")
    public ResponseEntity<Pet> updatePet(@PathVariable long id, @RequestBody Pet p){
        if (pawCareService.getPetById(id).isEmpty()) return ResponseEntity.notFound().build();
        if (p.getProcedures() == null) p.setProcedures(new ArrayList<>());
        return ResponseEntity.ok(pawCareService.updatePet(id, p));
    }

    @DeleteMapping("/pets/{id}")
    public ResponseEntity<Void> deletePet(@PathVariable long id){
        if (pawCareService.getPetById(id).isEmpty()) return ResponseEntity.notFound().build();
        pawCareService.deletePet(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value="/pets/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String,String>> uploadPhoto(@PathVariable long id,
                      @RequestPart("file") MultipartFile file) throws IOException {
        Pet pet = pawCareService.getPetById(id).orElse(null);
        if (pet == null) return ResponseEntity.notFound().build();

        String filename = System.currentTimeMillis() + "_" +
                StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        Path dest = Path.of(uploadDir, filename);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
        pet.setPhoto("/uploads/" + filename);
        pawCareService.updatePet(id, pet);
        return ResponseEntity.ok(Map.of("url", pet.getPhoto()));
    }

    @PostMapping("/pets/{id}/procedures")
    public ResponseEntity<Pet> addProcedure(@PathVariable long id, @RequestBody Procedure proc){
        try {
            Pet pet = pawCareService.addProcedureToPet(id, proc);
            return ResponseEntity.ok(pet);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /* --------- Appointments --------- */
    @GetMapping("/appointments")
    public List<Appointment> listAppts(){ return pawCareService.getAllAppointments(); }

    @PostMapping("/appointments")
    public Appointment createAppt(@RequestBody Appointment a){ return pawCareService.saveAppointment(a); }

    @PostMapping("/appointments/{id}/approve")
    public ResponseEntity<Appointment> approve(@PathVariable long id){
        try {
            Appointment appointment = pawCareService.approveAppointment(id);
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/appointments/{id}/done")
    public ResponseEntity<Appointment> done(@PathVariable long id){
        try {
            Appointment appointment = pawCareService.markAppointmentDone(id);
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/appointments/{id}")
    public ResponseEntity<Void> deleteAppt(@PathVariable long id){
        if (pawCareService.getAppointmentById(id).isEmpty()) return ResponseEntity.notFound().build();
        pawCareService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }

    /* --------- Prescriptions --------- */
    @GetMapping("/prescriptions")
    public List<Prescription> listRx(){ return pawCareService.getAllPrescriptions(); }

    @PostMapping("/prescriptions")
    public Prescription createRx(@RequestBody Prescription r){ return pawCareService.savePrescription(r); }

    @PostMapping("/prescriptions/{id}/dispense")
    public ResponseEntity<Prescription> dispense(@PathVariable long id){
        try {
            Prescription prescription = pawCareService.dispensePrescription(id);
            return ResponseEntity.ok(prescription);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /* --------- Reports & Ops --------- */
    @GetMapping("/ops/log")
    public List<OperationLog> opsLog(
            @RequestParam String from,
            @RequestParam String to
    ){
        LocalDate f = LocalDate.parse(from);
        LocalDate t = LocalDate.parse(to);
        return pawCareService.getOperationLogsBetween(f, t);
    }

    @GetMapping("/reports/summary")
    public ReportSummary summary(@RequestParam String period,
                                 @RequestParam(required=false) String from,
                                 @RequestParam(required=false) String to){
        LocalDate today = LocalDate.now();
        LocalDate start, end;

        switch (period) {
            case "day" -> { start = today; end = today; }
            case "week" -> { start = today.minusDays(6); end = today; }
            case "month" -> { start = today.withDayOfMonth(1); end = today; }
            case "custom" -> {
                start = LocalDate.parse(Objects.requireNonNull(from));
                end   = LocalDate.parse(Objects.requireNonNull(to));
            }
            default -> throw new IllegalArgumentException("Invalid period");
        }

        ReportSummary s = new ReportSummary();
        s.period = period;
        s.from = start.toString();
        s.to = end.toString();

        // Appointments Done
        s.appointmentsDone = (int) pawCareService.getAllAppointments().stream()
                .filter(a -> "Done".equalsIgnoreCase(a.getStatus()))
                .filter(a -> a.getCompletedAt() != null)
                .filter(a -> !a.getCompletedAt().isBefore(start) && !a.getCompletedAt().isAfter(end))
                .count();

        // Prescriptions Dispensed
        s.prescriptionsDispensed = (int) pawCareService.getAllPrescriptions().stream()
                .filter(r -> r.isDispensed() && r.getDispensedAt() != null)
                .filter(r -> !r.getDispensedAt().isBefore(start) && !r.getDispensedAt().isAfter(end))
                .count();

        // Pets Added — infer from ops log
        s.petsAdded = (int) pawCareService.getOperationLogsBetween(start, end).stream()
                .filter(o -> "PET_CREATED".equals(o.getType()))
                .count();

        // All events in window
        s.events = pawCareService.getOperationLogsBetween(start, end);

        return s;
    }
}
