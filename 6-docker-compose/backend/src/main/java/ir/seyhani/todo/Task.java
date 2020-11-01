package ir.seyhani.todo;

import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.validation.constraints.NotEmpty;

@Data
@Entity
public class Task {
    @Id
    @GeneratedValue
    private Long id;

    @NotEmpty
    private String text;
}
