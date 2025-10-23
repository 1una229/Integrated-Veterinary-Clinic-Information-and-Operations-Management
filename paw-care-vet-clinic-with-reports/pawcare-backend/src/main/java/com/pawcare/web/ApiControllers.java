package com.pawcare.web;

import com.pawcare.model.Models.*;
import com.pawcare.repo.InMemoryRepo;
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

    private final InMemoryRepo repo;
    private final String uploadDir;

    public ApiControllers(
            InMemoryRepo repo,
            @Value("${pawcare.upload-dir:uploads}") String uploadDir
    ) {
        this.repo = repo;
        this.uploadDir = (uploadDir == null || uploadDir.isBlank()) ? "uploads" : uploadDir;
        new File(this.uploadDir).mkdirs();
    }

    /* --------- Pets --------- */
    @GetMapping("/pets")
    public List<Pet> listPets(){ return repo.pets(); }

    @GetMapping("/pets/{id}")
    public ResponseEntity<Pet> getPet(@PathVariable long id){
        return repo.pet(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/pets")
    public Pet createPet(@RequestBody Pet p){
        if (p.procedures == null) p.procedures = new ArrayList<>();
        return repo.addPet(p);
    }

    @PutMapping("/pets/{id}")
    public ResponseEntity<Pet> updatePet(@PathVariable long id, @RequestBody Pet p){
        if (repo.pet(id).isEmpty()) return ResponseEntity.notFound().build();
        if (p.procedures == null) p.procedures = new ArrayList<>();
        return ResponseEntity.ok(repo.updatePet(id, p));
    }

    @DeleteMapping("/pets/{id}")
    public ResponseEntity<Void> deletePet(@PathVariable long id){
        if (repo.pet(id).isEmpty()) return ResponseEntity.notFound().build();
        repo.removePet(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value="/pets/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String,String>> uploadPhoto(@PathVariable long id,
                      @RequestPart("file") MultipartFile file) throws IOException {
        Pet pet = repo.pet(id).orElse(null);
        if (pet == null) return ResponseEntity.notFound().build();

        String filename = System.currentTimeMillis() + "_" +
                StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        Path dest = Path.of(uploadDir, filename);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
        pet.photo = "/uploads/" + filename;
        repo.updatePet(id, pet);
        return ResponseEntity.ok(Map.of("url", pet.photo));
    }

    @PostMapping("/pets/{id}/procedures")
    public ResponseEntity<Pet> addProcedure(@PathVariable long id, @RequestBody Procedure proc){
        Pet pet = repo.pet(id).orElse(null);
        if (pet == null) return ResponseEntity.notFound().build();
        if (pet.procedures == null) pet.procedures = new ArrayList<>();
        pet.procedures.add(proc);
        repo.updatePet(id, pet);
        return ResponseEntity.ok(pet);
    }

    /* --------- Appointments --------- */
    @GetMapping("/appointments")
    public List<Appointment> listAppts(){ return repo.appts(); }

    @PostMapping("/appointments")
    public Appointment createAppt(@RequestBody Appointment a){ return repo.addAppt(a); }

    @PostMapping("/appointments/{id}/approve")
    public ResponseEntity<Appointment> approve(@PathVariable long id){
        var opt = repo.appt(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        repo.approveAppt(id);
        return ResponseEntity.ok(opt.get());
    }

    @PostMapping("/appointments/{id}/done")
    public ResponseEntity<Appointment> done(@PathVariable long id){
        var opt = repo.appt(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        repo.doneAppt(id);
        return ResponseEntity.ok(opt.get());
    }

    @DeleteMapping("/appointments/{id}")
    public ResponseEntity<Void> deleteAppt(@PathVariable long id){
        if (repo.appt(id).isEmpty()) return ResponseEntity.notFound().build();
        repo.removeAppt(id);
        return ResponseEntity.noContent().build();
    }

    /* --------- Prescriptions --------- */
    @GetMapping("/prescriptions")
    public List<Prescription> listRx(){ return repo.rx(); }

    @PostMapping("/prescriptions")
    public Prescription createRx(@RequestBody Prescription r){ return repo.addRx(r); }

    @PostMapping("/prescriptions/{id}/dispense")
    public ResponseEntity<Prescription> dispense(@PathVariable long id){
        var opt = repo.getRx(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        repo.dispense(id);
        return ResponseEntity.ok(opt.get());
    }

    /* --------- Reports & Ops --------- */
    @GetMapping("/ops/log")
    public List<OperationLog> opsLog(
            @RequestParam String from,
            @RequestParam String to
    ){
        LocalDate f = LocalDate.parse(from);
        LocalDate t = LocalDate.parse(to);
        return repo.opsBetween(f, t);
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
        s.appointmentsDone = (int) repo.appts().stream()
                .filter(a -> "Done".equalsIgnoreCase(a.status))
                .filter(a -> a.completedAt != null)
                .filter(a -> {
                    LocalDate d = LocalDate.parse(a.completedAt);
                    return !d.isBefore(start) && !d.isAfter(end);
                }).count();

        // Prescriptions Dispensed
        s.prescriptionsDispensed = (int) repo.rx().stream()
                .filter(r -> r.dispensed && r.dispensedAt != null)
                .filter(r -> {
                    LocalDate d = LocalDate.parse(r.dispensedAt);
                    return !d.isBefore(start) && !d.isAfter(end);
                }).count();

        // Pets Added — infer from ops log
        s.petsAdded = (int) repo.opsBetween(start, end).stream()
                .filter(o -> "PET_CREATED".equals(o.type))
                .count();

        // All events in window
        s.events = repo.opsBetween(start, end);

        return s;
    }
}
