package com.pawcare.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "procedures")
public class Procedure {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "procedure_date")
    private LocalDate date;

    @Column(name = "procedure_name")
    private String procedure;

    private String notes;
    private String vet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id")
    private Pet pet;

    // Constructors
    public Procedure() {}

    public Procedure(LocalDate date, String procedure, String notes, String vet) {
        this.date = date;
        this.procedure = procedure;
        this.notes = notes;
        this.vet = vet;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getProcedure() { return procedure; }
    public void setProcedure(String procedure) { this.procedure = procedure; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getVet() { return vet; }
    public void setVet(String vet) { this.vet = vet; }

    public Pet getPet() { return pet; }
    public void setPet(Pet pet) { this.pet = pet; }
}

