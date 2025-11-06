package com.pawcare.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "appointments")
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pet_id")
    private Long petId;

    private String owner;
    private String code;
    private LocalDate date;
    private String time;
    private String vet;
    private String status;

    @Column(name = "completed_at")
    private LocalDate completedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", insertable = false, updatable = false)
    private Pet pet;

    // Constructors
    public Appointment() {}

    public Appointment(Long petId, String owner, LocalDate date, String time, String vet, String status) {
        this.petId = petId;
        this.owner = owner;
        this.date = date;
        this.time = time;
        this.vet = vet;
        this.status = status;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPetId() { return petId; }
    public void setPetId(Long petId) { this.petId = petId; }

    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public String getVet() { return vet; }
    public void setVet(String vet) { this.vet = vet; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDate completedAt) { this.completedAt = completedAt; }

    public Pet getPet() { return pet; }
    public void setPet(Pet pet) { this.pet = pet; }
}

