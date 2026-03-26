package com.smartquizzer.service;

import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;

@Service
public class PdfService {

    public String extractText(MultipartFile file) throws Exception {
        String fileName = file.getOriginalFilename();
        if (fileName == null || file.isEmpty()) return "";

        Tika tika = new Tika();
        
        try (InputStream stream = file.getInputStream()) {
            return tika.parseToString(stream);
        } catch (Exception e) {
            System.err.println("Text extraction failed: " + e.getMessage());
            throw new Exception("Document parsing failed: " + e.getMessage(), e);
        }
    }
}
